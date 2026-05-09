/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Analytics } from "@vercel/analytics/react";
import {
  Users,
  Receipt,
  UserPlus,
  Trash2,
  Check,
  ChevronRight,
  Plus,
  Minus,
  AlertCircle,
  ArrowLeft,
  IndianRupee,
  FileJson,
  Pencil,
  Copy,
  ClipboardPaste,
  X,
  FileText,
  Bot
} from "lucide-react";
import { Person, BillItem, Assignment, BillParseResult, TaxItem } from "./types";

function useStickyState<T>(defaultValue: T, key: string): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [step, setStep] = useStickyState<"group" | "assign" | "summary">("group", "billsplit_step");
  const [people, setPeople] = useStickyState<Person[]>([], "billsplit_people");
  const [newPersonName, setNewPersonName] = useState("");
  const [items, setItems] = useStickyState<BillItem[]>([], "billsplit_items");
  const [taxes, setTaxes] = useStickyState<TaxItem[]>([], "billsplit_taxes");
  const [taxSplitMethod, setTaxSplitMethod] = useStickyState<"equal" | "proportional">("equal", "billsplit_taxSplitMethod");
  const [assignments, setAssignments] = useStickyState<Assignment[]>([], "billsplit_assignments");

  // Inline editing states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [editTaxAmount, setEditTaxAmount] = useState("");

  // AI Overlay states
  const [showAiOverlay, setShowAiOverlay] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [pendingAiData, setPendingAiData] = useState<{ items: BillItem[], taxes: TaxItem[] } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // --- Group Management ---
  const addPerson = () => {
    if (newPersonName.trim()) {
      setPeople([...people, { id: crypto.randomUUID(), name: newPersonName.trim() }]);
      setNewPersonName("");
    }
  };

  const removePerson = (id: string) => {
    setPeople(people.filter(p => p.id !== id));
    setAssignments(assignments.map(a => ({
      ...a,
      portions: a.portions.filter(p => p.personId !== id)
    })));
  };

  // --- Item Management ---
  const handleAddItem = () => {
    const newId = crypto.randomUUID();
    const newItem: BillItem = { id: newId, name: "", price: 0 };
    setItems([...items, newItem]);
    setAssignments([...assignments, { itemId: newId, portions: [] }]);
    setEditingItemId(newId);
    setEditName("");
    setEditPrice("");
  };

  const handleEditItem = (item: BillItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPrice(item.price ? item.price.toString() : "");
  };

  const handleConfirmItem = (id: string) => {
    const priceNum = parseFloat(editPrice);
    if (!editName.trim() || isNaN(priceNum) || priceNum < 0) {
      alert("Please enter a valid name and positive price.");
      return;
    }
    setItems(items.map(item => item.id === id ? { ...item, name: editName.trim(), price: priceNum } : item));
    setEditingItemId(null);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setAssignments(assignments.filter(a => a.itemId !== id));
    if (editingItemId === id) setEditingItemId(null);
  };

  const handleClearAllItems = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAllItems = () => {
    setItems([]);
    setTaxes([]);
    setAssignments([]);
    setShowClearConfirm(false);
  };

  // --- Tax Management ---
  const handleAddTax = () => {
    if (taxes.length > 0) return; // Only 1 tax allowed
    const newId = crypto.randomUUID();
    setTaxes([{ id: newId, name: "Tax", amount: 0 }]);
    setEditingTaxId(newId);
    setEditTaxAmount("");
  };

  const handleEditTax = (tax: TaxItem) => {
    setEditingTaxId(tax.id);
    setEditTaxAmount(tax.amount ? tax.amount.toString() : "");
  };

  const handleConfirmTax = (id: string) => {
    const amountNum = parseFloat(editTaxAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      alert("Please enter a valid positive amount.");
      return;
    }
    setTaxes(taxes.map(tax => tax.id === id ? { ...tax, amount: amountNum } : tax));
    setEditingTaxId(null);
  };

  const handleDeleteTax = (id: string) => {
    setTaxes(taxes.filter(tax => tax.id !== id));
    if (editingTaxId === id) setEditingTaxId(null);
  };

  // --- Assignment Management ---
  const updatePortion = (itemId: string, personId: string, delta: number) => {
    setAssignments(prev => prev.map(a => {
      if (a.itemId === itemId) {
        const existingPortion = a.portions.find(p => p.personId === personId);
        
        if (!existingPortion && delta > 0) {
          return {
            ...a,
            portions: [...a.portions, { personId, count: delta }]
          };
        }

        if (existingPortion) {
          const newCount = Math.max(0, existingPortion.count + delta);
          if (newCount === 0) {
            return {
              ...a,
              portions: a.portions.filter(p => p.personId !== personId)
            };
          }
          return {
            ...a,
            portions: a.portions.map(p => 
              p.personId === personId ? { ...p, count: newCount } : p
            )
          };
        }
      }
      return a;
    }));
  };

  // --- AI Overlay Management ---
  const processAiText = () => {
    try {
      const lines = aiInputText.split('\n');
      const newItems: BillItem[] = [];
      let newTax: TaxItem | null = null;

      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(':');
        if (parts.length !== 2) continue; // Skip lines that aren't key-value
        const key = parts[0].trim();
        const valueStr = parts[1].trim();
        const valueNum = parseFloat(valueStr.replace(/[^0-9.-]+/g, ""));

        if (isNaN(valueNum)) continue;

        if (key.toLowerCase() === 'tax') {
          newTax = { id: crypto.randomUUID(), name: "Tax", amount: valueNum };
        } else {
          newItems.push({ id: crypto.randomUUID(), name: key, price: valueNum });
        }
      }

      if (newItems.length === 0 && !newTax) {
        setAiError("No valid items found. Please check the format.");
        return;
      }

      const aiTaxes = newTax ? [newTax] : [];

      if (items.length > 0 || taxes.length > 0) {
        setPendingAiData({ items: newItems, taxes: aiTaxes });
      } else {
        applyAiData(newItems, aiTaxes, "replace");
      }
    } catch (err) {
      setAiError("An error occurred while parsing.");
    }
  };

  const applyAiData = (aiItems: BillItem[], aiTaxes: TaxItem[], mode: "merge" | "replace") => {
    if (mode === "replace") {
      setItems(aiItems);
      // Ensure only 1 tax max is kept even on replace
      setTaxes(aiTaxes.length > 0 ? [aiTaxes[0]] : []);
      setAssignments(aiItems.map(item => ({ itemId: item.id, portions: [] })));
    } else {
      setItems([...items, ...aiItems]);
      // For tax, if merge, and we already have a tax, we can add the amount, or just ignore. 
      // The requirement says "Only ONE tax can be added". So let's replace the tax amount or ignore it?
      // "Merge will allow duplicates" - for items. For tax, let's just use the new tax if no tax exists, or update if exists.
      if (aiTaxes.length > 0) {
        if (taxes.length > 0) {
          setTaxes([{ ...taxes[0], amount: taxes[0].amount + aiTaxes[0].amount }]);
        } else {
          setTaxes([aiTaxes[0]]);
        }
      }
      setAssignments([...assignments, ...aiItems.map(item => ({ itemId: item.id, portions: [] }))]);
    }

    setShowAiOverlay(false);
    setAiInputText("");
    setAiError(null);
    setPendingAiData(null);
  };

  const copyPrompt = () => {
    const promptText = `Convert this bill into key value pairs of item and price in the following format:
item1 : <price>
item2 : <price>
...
tax : <price>

Do not add any other text. Enclose in copyable markdown plaintext.`;
    navigator.clipboard.writeText(promptText);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAiInputText(text);
    } catch (err) {
      console.error("Failed to read clipboard", err);
    }
  };

  // --- Calculations ---
  const totals = useMemo(() => {
    const personTotals: Record<string, number> = {};
    const personItemTotals: Record<string, number> = {};
    people.forEach(p => {
      personTotals[p.id] = 0;
      personItemTotals[p.id] = 0;
    });

    let totalAssignedItemsPrice = 0;

    assignments.forEach(a => {
      const item = items.find(i => i.id === a.itemId);
      // Migration/Safety: handle cases where portions might be undefined or use old personIds
      const portions = a.portions || [];
      
      if (item && portions.length > 0) {
        const totalPortions = portions.reduce((sum, p) => sum + p.count, 0);
        
        if (totalPortions > 0) {
          portions.forEach(p => {
            const splitPrice = item.price * (p.count / totalPortions);
            personTotals[p.personId] = (personTotals[p.personId] || 0) + splitPrice;
            personItemTotals[p.personId] = (personItemTotals[p.personId] || 0) + splitPrice;
          });
          totalAssignedItemsPrice += item.price;
        }
      }
    });

    const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);

    if (totalTax > 0 && people.length > 0) {
      if (taxSplitMethod === "equal") {
        const taxPerPerson = totalTax / people.length;
        people.forEach(p => {
          personTotals[p.id] += taxPerPerson;
        });
      } else if (taxSplitMethod === "proportional" && totalAssignedItemsPrice > 0) {
        people.forEach(p => {
          const proportion = personItemTotals[p.id] / totalAssignedItemsPrice;
          personTotals[p.id] += totalTax * proportion;
        });
      }
    }

    return personTotals;
  }, [people, items, assignments, taxes, taxSplitMethod]);

  const grandTotal = items.reduce((sum, item) => sum + item.price, 0) + taxes.reduce((sum, tax) => sum + tax.amount, 0);

  // --- UI Components ---
  const Header = () => (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
        <Receipt className="w-8 h-8 text-indigo-600" />
        BillSplit AI
      </h1>
      {step !== "group" && (
        <button
          onClick={() => {
            if (step === "assign") setStep("group");
            if (step === "summary") setStep("assign");
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-2xl mx-auto">
        <Header />

        <AnimatePresence mode="wait">
          {/* STEP 1: Configure Group */}
          {step === "group" && (
            <motion.div
              key="group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold">Who's splitting?</h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPerson()}
                  placeholder="Enter name..."
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  onClick={addPerson}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <UserPlus className="w-5 h-5" />
                  Add
                </button>
              </div>

              <div className="space-y-3 mb-8">
                {people.map((person) => (
                  <motion.div
                    layout
                    key={person.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group"
                  >
                    <span className="font-medium text-gray-700">{person.name}</span>
                    <button
                      onClick={() => removePerson(person.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove person"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
                {people.length === 0 && (
                  <p className="text-center text-gray-400 py-4 italic">No one added yet</p>
                )}
              </div>

              <button
                onClick={() => setStep("assign")}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                Continue to Bill
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Assign Items (combined with Item Creation) */}
          {step === "assign" && (
            <motion.div
              key="assign"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Check className="w-6 h-6 text-green-500" />
                    Bill Items
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearAllItems}
                      className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Clear all item
                    </button>
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                </div>

                {items.length === 0 && (
                  <p className="text-gray-400 text-sm italic text-center mb-6">No items added yet. Click "Add Item" or "Use AI" below.</p>
                )}

                <div className="space-y-4">
                  {items.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const assignment = assignments.find(a => a.itemId === item.id);

                    return (
                      <div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        {isEditing ? (
                          <div className="flex flex-col gap-3 mb-3">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Item Name"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>
                              <button
                                onClick={() => handleConfirmItem(item.id)}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shrink-0"
                                aria-label="Confirm item"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2 group/item">
                            <span className="font-semibold text-gray-800 break-words">{item.name || "Unnamed Item"}</span>
                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                              <span className="font-bold text-indigo-600">₹{item.price.toFixed(2)}</span>
                              <div className="flex items-center gap-1 transition-opacity">
                                <button onClick={() => handleEditItem(item)} className="p-2 text-gray-400 hover:text-indigo-600" aria-label="Edit item"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-500" aria-label="Delete item"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex flex-wrap gap-2">
                            {people.map((person) => {
                              const portion = assignment?.portions.find(p => p.personId === person.id);
                              const isAssigned = !!portion;
                              return (
                                <div
                                  key={person.id}
                                  className={`flex items-center gap-1 p-1 rounded-full border transition-all ${isAssigned
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                                    }`}
                                >
                                  {isAssigned && (
                                    <button
                                      onClick={() => updatePortion(item.id, person.id, -1)}
                                      className="p-1 hover:bg-indigo-500 rounded-full transition-colors"
                                      aria-label="Decrease portion"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => updatePortion(item.id, person.id, 1)}
                                    className={`px-2 py-1 text-sm font-medium ${isAssigned ? "hover:bg-indigo-500" : "hover:text-indigo-600"} rounded-full transition-colors`}
                                  >
                                    {person.name} {isAssigned && <span className="ml-1 opacity-90">({portion.count})</span>}
                                  </button>

                                  {isAssigned && (
                                    <button
                                      onClick={() => updatePortion(item.id, person.id, 1)}
                                      className="p-1 hover:bg-indigo-500 rounded-full transition-colors"
                                      aria-label="Increase portion"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tax Section */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Tax & Extra Charges</h3>
                      {taxes.length === 0 && (
                        <button
                          onClick={handleAddTax}
                          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Tax
                        </button>
                      )}
                    </div>
                    {taxes.length > 0 && (
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => setTaxSplitMethod("equal")}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${taxSplitMethod === "equal"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                          Equal Split
                        </button>
                        <button
                          onClick={() => setTaxSplitMethod("proportional")}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${taxSplitMethod === "proportional"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                          Proportional
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {taxes.map(tax => {
                      const isEditingTax = editingTaxId === tax.id;
                      return (
                        <div key={tax.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group/tax">
                          {isEditingTax ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <span className="font-medium text-gray-700">Tax Amount</span>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-32">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    value={editTaxAmount}
                                    onChange={(e) => setEditTaxAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  />
                                </div>
                                <button
                                  onClick={() => handleConfirmTax(tax.id)}
                                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shrink-0"
                                  aria-label="Confirm tax"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">{tax.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">₹{tax.amount.toFixed(2)}</span>
                                <div className="flex items-center gap-1 transition-opacity">
                                  <button onClick={() => handleEditTax(tax)} className="p-2 text-gray-400 hover:text-indigo-600" aria-label="Edit tax"><Pencil className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteTax(tax.id)} className="p-2 text-gray-400 hover:text-red-500" aria-label="Delete tax"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowAiOverlay(true)}
                  className="w-full bg-slate-800 text-white py-4 rounded-xl font-semibold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Bot className="w-5 h-5" />
                  Use AI to scan bill
                </button>
                <button
                  onClick={() => setStep("summary")}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  View Final Split
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Summary */}
          {step === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IndianRupee className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Final Split</h2>
                <p className="text-gray-500 mt-1">Total: ₹{grandTotal.toFixed(2)}</p>
              </div>

              <div className="space-y-4 mb-8">
                {people.map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {person.name[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800">{person.name}</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{totals[person.id].toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setItems([]);
                  setTaxes([]);
                  setAssignments([]);
                  setStep("group");
                }}
                className="w-full border-2 border-indigo-600 text-indigo-600 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-all"
              >
                Start New Split
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Overlay Modal */}
        <AnimatePresence>
          {showAiOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    AI Bill Scanner
                  </h3>
                  <button onClick={() => { setShowAiOverlay(false); setPendingAiData(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto">
                  {pendingAiData ? (
                    <div className="text-center py-4">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <h4 className="text-lg font-bold mb-2">Existing Items Found</h4>
                      <p className="text-sm text-gray-500 mb-6">
                        You already have items in your bill. Do you want to merge the AI items with your existing ones, or replace everything?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => applyAiData(pendingAiData.items, pendingAiData.taxes, "merge")}
                          className="flex-1 bg-indigo-100 text-indigo-700 py-3 rounded-xl font-semibold hover:bg-indigo-200 transition-colors"
                        >
                          Merge
                        </button>
                        <button
                          onClick={() => applyAiData(pendingAiData.items, pendingAiData.taxes, "replace")}
                          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">1. How to use</h4>
                        <p className="text-sm text-gray-600">Upload your bill to any AI app and paste the below prompt, then copy and paste the result into the text area below. Click done to process the bill.</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-900">2. Copy Prompt</h4>
                          <button onClick={copyPrompt} className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-700 whitespace-pre-wrap select-all">
                          {`Convert this bill into key value pairs of item and price in the following format:
item1 : <price>
item2 : <price>
...
tax : <price>

Do not add any other text, do not add colons even if it is in the item name. Enclose in copyable markdown plaintext.`}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-900">3. Paste Result</h4>
                          <button onClick={pasteFromClipboard} className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                            <ClipboardPaste className="w-3 h-3" /> Paste
                          </button>
                        </div>
                        <textarea
                          value={aiInputText}
                          onChange={(e) => setAiInputText(e.target.value)}
                          className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                          placeholder="item1 : 12.50&#10;item2 : 5.00&#10;tax : 1.50"
                        />
                        {aiError && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {aiError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!pendingAiData && (
                  <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50">
                    <button
                      onClick={() => setShowAiOverlay(false)}
                      className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={processAiText}
                      disabled={!aiInputText.trim()}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear Confirmation Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 text-center"
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Clear all items?</h3>
                <p className="text-gray-500 mb-8 text-sm">Are you sure to clear all items? This will remove all items and taxes.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClearAllItems}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      <Analytics />
    </div>
  );
}
