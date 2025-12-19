
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Calculator, History as HistoryIcon, Sparkles, X, Trash2, Send, ChevronRight, Loader2 } from 'lucide-react';
import { Calculation } from './types';
import { solveMathWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<Calculation[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('calc_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (expr: string, res: string) => {
    const newCalc: Calculation = {
      id: Math.random().toString(36).substring(7),
      expression: expr,
      result: res,
      timestamp: Date.now()
    };
    setHistory(prev => [newCalc, ...prev].slice(0, 50));
  };

  const handleDigit = (digit: string) => {
    setDisplay(prev => (prev === '0' ? digit : prev + digit));
    setError(null);
  };

  const handleOperator = (op: string) => {
    setExpression(prev => prev + display + ' ' + op + ' ');
    setDisplay('0');
    setError(null);
  };

  const calculateResult = () => {
    try {
      const fullExpr = expression + display;
      // Basic security check and evaluation
      // In a real production app, use a dedicated parser like mathjs
      const sanitizedExpr = fullExpr.replace(/[^-0-9+*/.%() ]/g, '');
      const result = eval(sanitizedExpr);
      const resultStr = Number.isFinite(result) ? result.toString() : 'Error';
      
      setDisplay(resultStr);
      setExpression('');
      addToHistory(fullExpr, resultStr);
    } catch (e) {
      setError("Invalid Expression");
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setExpression('');
    setError(null);
  };

  const deleteLast = () => {
    setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleAiInquiry = async () => {
    if (!aiPrompt && display === '0') return;
    
    setIsAiLoading(true);
    setAiResponse(null);
    setError(null);

    const query = aiPrompt || (expression + display);
    
    try {
      const response = await solveMathWithAI(query);
      setAiResponse(response);
    } catch (err: any) {
      setError(err.message || "Something went wrong with the AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Calculator Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <header className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Calc-Pro <span className="text-blue-400 font-light">AI</span></h1>
            </div>
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors relative"
            >
              <HistoryIcon className="w-6 h-6 text-slate-400" />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          </header>

          <main className="glass rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Display Area */}
            <div className="mb-6 text-right">
              <div className="h-8 text-slate-400 text-lg mono overflow-hidden text-ellipsis whitespace-nowrap">
                {expression}
              </div>
              <div className="text-6xl font-bold mono text-white truncate py-2">
                {display}
              </div>
              {error && (
                <div className="text-rose-400 text-sm mt-2 animate-pulse">{error}</div>
              )}
            </div>

            {/* Grid of Buttons */}
            <div className="grid grid-cols-4 gap-3">
              {['AC', 'DEL', '%', '/'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === 'AC') clearAll();
                    else if (item === 'DEL') deleteLast();
                    else if (item === '%') setDisplay(prev => (parseFloat(prev) / 100).toString());
                    else handleOperator(item);
                  }}
                  className={`calc-btn h-16 sm:h-20 rounded-2xl flex items-center justify-center text-xl font-semibold 
                    ${item === '/' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                >
                  {item}
                </button>
              ))}

              {['7', '8', '9', '*'].map((item) => (
                <button
                  key={item}
                  onClick={() => (item === '*' ? handleOperator('*') : handleDigit(item))}
                  className={`calc-btn h-16 sm:h-20 rounded-2xl flex items-center justify-center text-xl font-semibold 
                    ${item === '*' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800/80 text-white hover:bg-slate-700'}`}
                >
                  {item === '*' ? '×' : item}
                </button>
              ))}

              {['4', '5', '6', '-'].map((item) => (
                <button
                  key={item}
                  onClick={() => (item === '-' ? handleOperator('-') : handleDigit(item))}
                  className={`calc-btn h-16 sm:h-20 rounded-2xl flex items-center justify-center text-xl font-semibold 
                    ${item === '-' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800/80 text-white hover:bg-slate-700'}`}
                >
                  {item}
                </button>
              ))}

              {['1', '2', '3', '+'].map((item) => (
                <button
                  key={item}
                  onClick={() => (item === '+' ? handleOperator('+') : handleDigit(item))}
                  className={`calc-btn h-16 sm:h-20 rounded-2xl flex items-center justify-center text-xl font-semibold 
                    ${item === '+' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800/80 text-white hover:bg-slate-700'}`}
                >
                  {item}
                </button>
              ))}

              <button
                onClick={() => handleDigit('0')}
                className="calc-btn h-16 sm:h-20 col-span-2 rounded-2xl bg-slate-800/80 text-white text-xl font-semibold hover:bg-slate-700 flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={() => handleDigit('.')}
                className="calc-btn h-16 sm:h-20 rounded-2xl bg-slate-800/80 text-white text-xl font-semibold hover:bg-slate-700 flex items-center justify-center"
              >
                .
              </button>
              <button
                onClick={calculateResult}
                className="calc-btn h-16 sm:h-20 rounded-2xl bg-indigo-600 text-white text-3xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center"
              >
                =
              </button>
            </div>
          </main>

          {/* Quick AI solve bar */}
          <div className="glass rounded-2xl p-4 flex gap-3 items-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <input 
              type="text" 
              placeholder="Ask AI to solve or explain..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-slate-200 placeholder-slate-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAiInquiry()}
            />
            <button 
              onClick={handleAiInquiry}
              disabled={isAiLoading}
              className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Sidebar / Info Column */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          {/* History Panel */}
          {isHistoryOpen && (
            <div className="glass rounded-3xl p-6 flex-1 flex flex-col min-h-[400px] max-h-[600px] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5" />
                  History
                </h3>
                <button 
                  onClick={() => setHistory([])}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                    <HistoryIcon className="w-12 h-12 opacity-20" />
                    <p>No recent calculations</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/60 cursor-pointer group transition-all"
                      onClick={() => {
                        setDisplay(item.result);
                        setExpression('');
                      }}
                    >
                      <div className="text-slate-400 text-sm mono mb-1 group-hover:text-slate-300">
                        {item.expression} =
                      </div>
                      <div className="text-white font-bold text-xl mono flex justify-between items-center">
                        {item.result}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* AI Explanation Panel */}
          {(aiResponse || isAiLoading) && (
            <div className="glass border-amber-500/30 rounded-3xl p-6 flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Gemini Insight
                </h3>
                <button 
                  onClick={() => setAiResponse(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-400" />
                    <p className="animate-pulse">Thinking through the math...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-amber max-w-none text-slate-300 leading-relaxed">
                    <div className="whitespace-pre-wrap">
                      {aiResponse}
                    </div>
                  </div>
                )}
              </div>
              {!isAiLoading && (
                <div className="mt-4 pt-4 border-t border-slate-700 text-[10px] text-slate-500 uppercase tracking-widest text-center">
                  Powered by Gemini AI Engine
                </div>
              )}
            </div>
          )}
          
          {/* Helpful Tips Placeholder if sidebar is empty */}
          {!isHistoryOpen && !aiResponse && !isAiLoading && (
            <div className="glass rounded-3xl p-8 flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Smart Assistant</h4>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                  Ask me to explain formulas, solve word problems, or help with calculus. I'm integrated directly with Gemini.
                </p>
              </div>
              <button 
                onClick={() => setAiPrompt("What is the golden ratio used for?")}
                className="px-4 py-2 bg-slate-800 rounded-lg text-slate-300 text-sm hover:bg-slate-700 transition-colors"
              >
                Try: "Explain the golden ratio"
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
