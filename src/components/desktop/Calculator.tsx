import { useState } from "react";
import { Calculator as CalcIcon, Delete } from "lucide-react";

const KEYS = [
  ["C", "+/-", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");

  const evalSafe = (raw: string): string => {
    const sanitized = raw.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    if (!/^[\d+\-*/.()% ]+$/.test(sanitized)) return "Err";
    try {
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict"; return (${sanitized.replace(/%/g, "/100")});`)();
      if (typeof v !== "number" || !isFinite(v)) return "Err";
      return String(parseFloat(v.toPrecision(12)));
    } catch { return "Err"; }
  };

  const press = (k: string) => {
    if (k === "C") { setExpr(""); setDisplay("0"); return; }
    if (k === "⌫") {
      const next = expr.slice(0, -1);
      setExpr(next); setDisplay(next || "0"); return;
    }
    if (k === "=") {
      const r = evalSafe(expr || display);
      setDisplay(r); setExpr(r === "Err" ? "" : r); return;
    }
    if (k === "+/-") {
      if (display.startsWith("-")) setDisplay(display.slice(1));
      else if (display !== "0") setDisplay("-" + display);
      return;
    }
    const next = (expr === "" && /[\d.]/.test(k)) ? k : expr + k;
    setExpr(next); setDisplay(next);
  };

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <CalcIcon className="h-4 w-4" />
        <span className="text-sm font-medium">Calculator</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 items-end justify-end overflow-hidden rounded-2xl bg-white/[0.03] px-5 py-4 ring-1 ring-white/10">
          <span className="truncate font-mono text-4xl font-light tracking-tight">{display}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {KEYS.flat().map((k) => {
            const isOp = ["÷","×","−","+","="].includes(k);
            const isFn = ["C","+/-","%","⌫"].includes(k);
            return (
              <button
                key={k}
                onClick={() => press(k)}
                className={`h-14 rounded-xl text-lg font-medium transition active:scale-95 ${
                  isOp ? "bg-white text-black hover:bg-white/90"
                  : isFn ? "bg-white/10 text-foreground hover:bg-white/15"
                  : "bg-white/[0.06] text-foreground hover:bg-white/10"
                }`}
              >
                {k === "⌫" ? <Delete className="mx-auto h-4 w-4" /> : k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
