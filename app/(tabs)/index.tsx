import "@/global.css";
import * as SQLite from "expo-sqlite";
import { Bot, Edit3, PhilippinePeso, Send, Trash2, TrendingUp } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { askOpenRouter } from "../../services/deepseek";

const { width } = Dimensions.get("window");

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: "Needs" | "Wants" | "Savings";
  date: string;
};

type ChatMessage = {
  id: number;
  text: string;
  sender: "user" | "bot";
};


// Simple Progress Bar Component
const ProgressBar = ({ progress, color, height = 8 }: { progress: number; color: string; height?: number }) => (
  <View style={{ height, backgroundColor: "#ECF0F1", borderRadius: height / 2, overflow: "hidden" }}>
    <View style={{ height: "100%", width: `${Math.min(progress, 100)}%`, backgroundColor: color, borderRadius: height / 2 }} />
  </View>
);

export default function ExpenseTrackerScreen() {
  const [salary, setSalary] = useState<string>("4500");
  const [isEditingSalary, setIsEditingSalary] = useState<boolean>(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: "Hello! I'm your expense assistant. Describe your expense and I'll help categorize it.", sender: "bot" },
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const dbRef = useRef<any>(null);

  // Initialize DB only once
  useEffect(() => {
    if (Platform.OS !== "web") {
      try {
        // Use openDatabaseSync (available in this build) which exposes the transaction API and matches typings
        dbRef.current = SQLite.openDatabaseSync("expenses.db");
        
        // Initialize table
        dbRef.current.transaction((tx: any) => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS expenses (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              amount REAL NOT NULL,
              category TEXT NOT NULL,
              date TEXT NOT NULL
            );`
          );
        });

        // Load existing expenses
        dbRef.current.transaction((tx: any) => {
          tx.executeSql(
            "SELECT * FROM expenses ORDER BY date DESC;",
            [],
            (_tx: any, result: any) => {
              const loadedExpenses: Expense[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                loadedExpenses.push(result.rows.item(i));
              }
              setExpenses(loadedExpenses);
            },
            (_tx: any, error: any) => {
              console.warn("Error loading expenses:", error);
              return false;
            }
          );
        });
      } catch (err) {
        console.warn("SQLite initialization error:", err);
      }
    } else {
      // Web: load from localStorage
      if (window.localStorage) {
        const raw = window.localStorage.getItem("expenses");
        const loadedExpenses = raw ? JSON.parse(raw) : [];
        setExpenses(loadedExpenses);
      }
    }
  }, []);

  // Save expense function
  const saveExpense = (expense: Expense) => {
    const newExpenses = [...expenses, expense];
    setExpenses(newExpenses);
    
    if (Platform.OS === "web" && window.localStorage) {
      window.localStorage.setItem("expenses", JSON.stringify(newExpenses));
    } else if (dbRef.current) {
      dbRef.current.transaction((tx: any) => {
        tx.executeSql(
          "INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?);",
          [expense.title, expense.amount, expense.category, expense.date],
          () => console.log("Expense saved successfully"),
          (_tx: any, error: any) => {
            console.warn("Error saving expense:", error);
            return false;
          }
        );
      });
    }
  };

  // Delete expense function
  const deleteExpense = (id: number) => {
    const filtered = expenses.filter(e => e.id !== id);
    setExpenses(filtered);
    
    if (Platform.OS === "web" && window.localStorage) {
      window.localStorage.setItem("expenses", JSON.stringify(filtered));
    } else if (dbRef.current) {
      dbRef.current.transaction((tx: any) => {
        tx.executeSql(
          "DELETE FROM expenses WHERE id = ?;",
          [id],
          () => console.log("Expense deleted successfully"),
          (_tx: any, error: any) => {
            console.warn("Error deleting expense:", error);
            return false;
          }
        );
      });
    }
  };

  // Categorization helper
  const categorizeExpense = (text: string): Expense["category"] => {
    const lower = text.toLowerCase();
    if (["grocery", "groceries", "food", "electric", "rent", "medicine"].some(k => lower.includes(k))) return "Needs";
    if (["netflix", "movie", "dinner", "shopping", "game"].some(k => lower.includes(k))) return "Wants";
    if (["saving", "fund", "investment"].some(k => lower.includes(k))) return "Savings";
    return "Wants";
  };

  // Handle AI chat
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { id: Date.now(), text: inputText, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const prompt = `
      Act like a friendly assistant. Reply naturally like a human. 
      At the end, provide a JSON with { "title": string, "amount": number, "category": "Needs" | "Wants" | "Savings" } 
      Ensure "amount" is always numeric (use 0 if unknown).
      Example:
      "I've added your groceries expense of ₱245 to Needs 🛒

      JSON: {...}"
      User text: "${userMsg.text}"
    `;

      const response: any = await askOpenRouter(prompt);
      const aiText = typeof response === "string" ? response : response?.choices?.[0]?.message?.content || "";

      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      let newExpense: Expense | null = null;

      if (jsonMatch) {
        try {
          const expenseData = JSON.parse(jsonMatch[0]);
          const createdExpense: Expense = {
            id: Date.now(),
            title: expenseData.title || userMsg.text,
            amount: Number(expenseData.amount) || 0,
            category: expenseData.category || "Wants",
            date: new Date().toISOString().split("T")[0],
          };
          newExpense = createdExpense;
          saveExpense(createdExpense);
        } catch {
          console.warn("Failed to parse AI JSON:", jsonMatch[0]);
        }
      }

      const displayText = newExpense
        ? `${aiText.split("JSON:")[0].trim()}\n\nCategorized as: ${newExpense.category} ${newExpense.category === "Needs" ? "🛒" : newExpense.category === "Wants" ? "🎮" : "💰"}`
        : aiText;

      const botMsg: ChatMessage = { id: Date.now() + 1, text: displayText, sender: "bot" };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      const botMsg: ChatMessage = { id: Date.now() + 1, text: "Sorry, I couldn't process that right now.", sender: "bot" };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Totals
  const needsTotal = expenses.filter(e => e.category === "Needs").reduce((s, e) => s + (typeof e.amount === "number" ? e.amount : 0), 0);
  const wantsTotal = expenses.filter(e => e.category === "Wants").reduce((s, e) => s + (typeof e.amount === "number" ? e.amount : 0), 0);
  const savingsTotal = expenses.filter(e => e.category === "Savings").reduce((s, e) => s + (typeof e.amount === "number" ? e.amount : 0), 0);

  const renderChatItem = ({ item }: { item: ChatMessage }) => (
    <View className={`flex-row mb-3 ${item.sender === "user" ? "justify-end" : "justify-start"}`}>
      <View className={`max-w-[80%] rounded-2xl p-4 ${item.sender === "user" ? "bg-[#3498DB] rounded-tr-none" : "bg-[#ECF0F1] rounded-tl-none"}`}>
        <Text className={`text-sm ${item.sender === "user" ? "text-white" : "text-[#2C3E50]"}`}>{item.text}</Text>
      </View>
    </View>
  );

  // Calculate budget data
  const salaryNum = parseFloat(salary || "0");
  const budgets = {
    Needs: salaryNum * 0.5,
    Wants: salaryNum * 0.3,
    Savings: salaryNum * 0.2,
  };

  const spent = {
    Needs: expenses.filter(e => e.category === "Needs").reduce((sum, e) => sum + e.amount, 0),
    Wants: expenses.filter(e => e.category === "Wants").reduce((sum, e) => sum + e.amount, 0),
    Savings: expenses.filter(e => e.category === "Savings").reduce((sum, e) => sum + e.amount, 0),
  };

  const remaining = {
    Needs: Math.max(budgets.Needs - spent.Needs, 0),
    Wants: Math.max(budgets.Wants - spent.Wants, 0),
    Savings: Math.max(budgets.Savings - spent.Savings, 0),
  };

  // Data for visualization
  const budgetData = [
    { label: "Needs", spent: spent.Needs, budget: budgets.Needs, remaining: remaining.Needs, color: "#3498DB" },
    { label: "Wants", spent: spent.Wants, budget: budgets.Wants, remaining: remaining.Wants, color: "#9B59B6" },
    { label: "Savings", spent: spent.Savings, budget: budgets.Savings, remaining: remaining.Savings, color: "#2ECC71" },
  ];

  return (
    <View className="flex-1 bg-[#ECF0F1]">
      {/* Header */}
      <View className="bg-[#2C3E50] p-6 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold text-center">Expense Tracker</Text>
        <Text className="text-[#BDC3C7] text-center mt-1">Manage your finances with AI assistance</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Salary Section */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-[#2C3E50]">Monthly Salary</Text>
            <TouchableOpacity onPress={() => setIsEditingSalary(!isEditingSalary)}>
              <Edit3 size={20} color="#3498DB" />
            </TouchableOpacity>
          </View>
          {isEditingSalary ? (
            <View className="flex-row items-center">
              <PhilippinePeso size={20} color="#7F8C8D" />
              <TextInput
                className="flex-1 mx-2 text-xl font-bold text-[#2C3E50] border-b border-[#BDC3C7]"
                value={salary}
                onChangeText={setSalary}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity className="bg-[#3498DB] px-4 py-2 rounded-lg" onPress={() => setIsEditingSalary(false)}>
                <Text className="text-white font-bold">Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center">
              <PhilippinePeso size={24} color="#2C3E50" />
              <Text className="text-3xl font-bold text-[#2C3E50] ml-2">
                {parseFloat(salary || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          )}
        </View>
        
        {/* 50/30/20 Rule Section - UPDATED */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
          <View className="flex-row items-center mb-4">
            <TrendingUp size={24} color="#3498DB" />
            <Text className="text-lg font-bold text-[#2C3E50] ml-2">50/30/20 Rule</Text>
          </View>

          {/* Budget Overview */}
          <View className="space-y-4">
            {budgetData.map((item) => (
              <View key={item.label} className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="font-medium text-[#2C3E50]">{item.label}</Text>
                  <Text className="font-bold text-[#2C3E50]">
                    ₱{item.spent.toFixed(0)} / ₱{item.budget.toFixed(0)}
                  </Text>
                </View>
                <ProgressBar 
                  progress={(item.spent / item.budget) * 100} 
                  color={item.color}
                  height={12}
                />
                <View className="flex-row justify-between mt-1">
                  <Text className="text-xs text-[#7F8C8D]">
                    {item.remaining > 0 ? `₱${item.remaining.toFixed(0)} remaining` : "Budget exceeded"}
                  </Text>
                  <Text className="text-xs text-[#7F8C8D]">
                    {Math.min((item.spent / item.budget) * 100, 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Summary Cards */}
          <View className="flex-row justify-between mt-6">
            <View className="items-center flex-1">
              <View className="w-4 h-4 rounded-full mb-1 bg-[#3498DB]" />
              <Text className="text-xs text-[#7F8C8D]">Needs</Text>
              <Text className="text-sm font-bold text-[#2C3E50]">₱{spent.Needs.toFixed(0)}</Text>
            </View>
            <View className="items-center flex-1">
              <View className="w-4 h-4 rounded-full mb-1 bg-[#9B59B6]" />
              <Text className="text-xs text-[#7F8C8D]">Wants</Text>
              <Text className="text-sm font-bold text-[#2C3E50]">₱{spent.Wants.toFixed(0)}</Text>
            </View>
            <View className="items-center flex-1">
              <View className="w-4 h-4 rounded-full mb-1 bg-[#2ECC71]" />
              <Text className="text-xs text-[#7F8C8D]">Savings</Text>
              <Text className="text-sm font-bold text-[#2C3E50]">₱{spent.Savings.toFixed(0)}</Text>
            </View>
            <View className="items-center flex-1">
              <View className="w-4 h-4 rounded-full mb-1 bg-[#ECF0F1]" />
              <Text className="text-xs text-[#7F8C8D]">Remaining</Text>
              <Text className="text-sm font-bold text-[#2C3E50]">
                ₱{(remaining.Needs + remaining.Wants + remaining.Savings).toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Expenses */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
          <Text className="text-lg font-bold text-[#2C3E50] mb-3">Recent Expenses</Text>
          <View className="space-y-3">
            {expenses.slice(-5).map((expense) => (
              <View key={expense.id} className="flex-row items-center justify-between pb-3 border-b border-[#ECF0F1]">
                <View>
                  <Text className="font-bold text-[#2C3E50]">{expense.title}</Text>
                  <Text className="text-xs text-[#7F8C8D]">{expense.date}</Text>
                </View>
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full mr-2 ${
                    expense.category === "Needs" ? "bg-[#3498DB]" : 
                    expense.category === "Wants" ? "bg-[#9B59B6]" : "bg-[#2ECC71]"
                  }`} />
                  <Text className="font-bold text-[#2C3E50] mr-2">₱{expense.amount.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => deleteExpense(expense.id)}>
                    <Trash2 size={18} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {expenses.length === 0 && (
              <Text className="text-center text-[#7F8C8D] py-4">No expenses yet. Start chatting with the AI assistant to add expenses!</Text>
            )}
          </View>
        </View>

        {/* AI Chat */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
          <View className="flex-row items-center mb-4">
            <Bot size={24} color="#3498DB" />
            <Text className="text-lg font-bold text-[#2C3E50] ml-2">AI Expense Assistant</Text>
          </View>
          <View className="h-64 bg-[#F8F9FA] rounded-xl p-4 mb-4">
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id.toString()}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            {isTyping && (
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 bg-[#3498DB] rounded-full mx-1" />
                <View className="w-2 h-2 bg-[#3498DB] rounded-full mx-1" />
                <View className="w-2 h-2 bg-[#3498DB] rounded-full mx-1" />
              </View>
            )}
          </View>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-[#ECF0F1] rounded-full py-3 px-4 mr-2"
              placeholder="Describe your expense..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity className="bg-[#3498DB] rounded-full p-3" onPress={handleSendMessage}>
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}