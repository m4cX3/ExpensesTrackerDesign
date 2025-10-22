import "@/global.css";
import { Bot, Calendar, Edit3, PhilippinePeso, Send, TrendingUp } from "lucide-react-native";
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PieChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");

// Mock data for expenses
const mockExpenses = [
  { id: 1, title: "Groceries", amount: 245.75, category: "Needs", date: "2023-06-15" },
  { id: 2, title: "Netflix Subscription", amount: 15.99, category: "Wants", date: "2023-06-10" },
  { id: 3, title: "Electricity Bill", amount: 89.50, category: "Needs", date: "2023-06-05" },
  { id: 4, title: "Dinner Out", amount: 65.30, category: "Wants", date: "2023-06-18" },
  { id: 5, title: "Emergency Fund", amount: 200.00, category: "Savings", date: "2023-06-20" },
];

// Mock data for 50/30/20 rule distribution
const ruleData = [
  { value: 50, color: "#3498DB", text: "Needs" },
  { value: 30, color: "#9B59B6", text: "Wants" },
  { value: 20, color: "#2ECC71", text: "Savings" },
];

// Mock chat messages
const initialMessages = [
  { id: 1, text: "Hello! I'm your expense assistant. Describe your expense and I'll help categorize it.", sender: "bot" },
];

export default function ExpenseTrackerScreen() {
  const [salary, setSalary] = useState<string>("4500");
  const [isEditingSalary, setIsEditingSalary] = useState<boolean>(false);
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<any>>(null);

  // Calculate totals based on mock expenses
  const needsTotal = mockExpenses
    .filter(expense => expense.category === "Needs")
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const wantsTotal = mockExpenses
    .filter(expense => expense.category === "Wants")
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const savingsTotal = mockExpenses
    .filter(expense => expense.category === "Savings")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const needsPercentage = salary ? (needsTotal / parseFloat(salary)) * 100 : 0;
  const wantsPercentage = salary ? (wantsTotal / parseFloat(salary)) * 100 : 0;
  const savingsPercentage = salary ? (savingsTotal / parseFloat(salary)) * 100 : 0;

  const handleSaveSalary = () => {
    setIsEditingSalary(false);
  };

  // Function to categorize expense using AI (mock implementation)
  const categorizeExpense = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based categorization (mock AI)
    if (lowerText.includes("grocery") || lowerText.includes("food") || lowerText.includes("electricity") || 
        lowerText.includes("rent") || lowerText.includes("utility") || lowerText.includes("medicine")) {
      return "Needs";
    } else if (lowerText.includes("netflix") || lowerText.includes("dinner") || lowerText.includes("movie") || 
               lowerText.includes("entertainment") || lowerText.includes("shopping") || lowerText.includes("gaming")) {
      return "Wants";
    } else if (lowerText.includes("saving") || lowerText.includes("emergency") || lowerText.includes("fund") || 
               lowerText.includes("investment")) {
      return "Savings";
    } else {
      // Default to Wants for unknown categories
      return "Wants";
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user"
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const category = categorizeExpense(newUserMessage.text);
      const botResponse = {
        id: messages.length + 2,
        text: `I've categorized your expense as "${category}". You can now add it to your expenses.`,
        sender: "bot",
        category: category
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className={`flex-row mb-3 ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <View className={`max-w-[80%] rounded-2xl p-4 ${item.sender === 'user' ? 'bg-[#3498DB] rounded-tr-none' : 'bg-[#ECF0F1] rounded-tl-none'}`}>
        <Text className={`text-sm ${item.sender === 'user' ? 'text-white' : 'text-[#2C3E50]'}`}>
          {item.text}
        </Text>
        {item.category && (
          <View className="mt-2 self-start">
            <View className={`px-3 py-1 rounded-full ${item.category === 'Needs' ? 'bg-[#3498DB]' : item.category === 'Wants' ? 'bg-[#9B59B6]' : 'bg-[#2ECC71]'}`}>
              <Text className="text-white text-xs font-bold">{item.category}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

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
              <TouchableOpacity 
                className="bg-[#3498DB] px-4 py-2 rounded-lg"
                onPress={handleSaveSalary}
              >
                <Text className="text-white font-bold">Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center">
              <PhilippinePeso size={24} color="#2C3E50" />
              <Text className="text-3xl font-bold text-[#2C3E50] ml-2">
                {parseFloat(salary || "0").toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}
        </View>

        {/* 50/30/20 Rule Visualization */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
          <View className="flex-row items-center mb-4">
            <TrendingUp size={24} color="#3498DB" />
            <Text className="text-lg font-bold text-[#2C3E50] ml-2">50/30/20 Rule</Text>
          </View>
          
          <View className="items-center mb-4">
            <PieChart
              data={ruleData}
              donut
              showText
              textColor="black"
              radius={100}
              textSize={16}
              fontWeight="bold"
              showTextBackground={false}
              innerCircleColor="#ECF0F1"
              centerLabelComponent={() => (
                <View className="items-center">
                  <Text className="text-lg font-bold text-[#2C3E50]">Rule</Text>
                  <Text className="text-sm text-[#7F8C8D]">Distribution</Text>
                </View>
              )}
            />
          </View>

          <View className="flex-row justify-between mt-4">
            <View className="items-center">
              <View className="w-4 h-4 bg-[#3498DB] rounded-full mb-1"></View>
              <Text className="text-xs text-[#7F8C8D]">Needs</Text>
              <Text className="text-sm font-bold text-[#2C3E50]">
                ₱{(parseFloat(salary || "0") * 0.5).toFixed(0)}
              </Text>
            </View>
            <View className="items-center">
              <View className="w-4 h-4 bg-[#9B59B6] rounded-full mb-1"></View>
              <Text className="text-xs text-[#7F8C8D]">Wants</Text>
              <Text className="text-sm font-bold text-[#2C3E50]">
                ₱{(parseFloat(salary || "0") * 0.3).toFixed(0)}
              </Text>
            </View>
            <View className="items-center">
              <View className="w-4 h-4 bg-[#2ECC71] rounded-full mb-1"></View>
              <Text className="text-xs text-[#7F8C8D]">Savings</Text>
              <Text className="text-sm font-bold text-[#2C3E50]">
                ₱{(parseFloat(salary || "0") * 0.2).toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expense Summary */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
          <View className="flex-row items-center mb-4">
            <Calendar size={24} color="#3498DB" />
            <Text className="text-lg font-bold text-[#2C3E50] ml-2">This Month</Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-[#7F8C8D]">Needs</Text>
            <Text className="font-bold text-[#2C3E50]">
              ₱{needsTotal.toFixed(2)} / ₱{(parseFloat(salary || "0") * 0.5).toFixed(0)}
            </Text>
          </View>
          <View className="h-2 bg-[#ECF0F1] rounded-full mb-4">
            <View 
              className="h-full bg-[#3498DB] rounded-full" 
              style={{ width: `${Math.min(needsPercentage, 100)}%` }}
            />
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-[#7F8C8D]">Wants</Text>
            <Text className="font-bold text-[#2C3E50]">
              ₱{wantsTotal.toFixed(2)} / ₱{(parseFloat(salary || "0") * 0.3).toFixed(0)}
            </Text>
          </View>
          <View className="h-2 bg-[#ECF0F1] rounded-full mb-4">
            <View 
              className="h-full bg-[#9B59B6] rounded-full" 
              style={{ width: `${Math.min(wantsPercentage, 100)}%` }}
            />
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-[#7F8C8D]">Savings</Text>
            <Text className="font-bold text-[#2C3E50]">
              ₱{savingsTotal.toFixed(2)} / ₱{(parseFloat(salary || "0") * 0.2).toFixed(0)}
            </Text>
          </View>
          <View className="h-2 bg-[#ECF0F1] rounded-full">
            <View 
              className="h-full bg-[#2ECC71] rounded-full" 
              style={{ width: `${Math.min(savingsPercentage, 100)}%` }}
            />
          </View>
        </View>

        {/* Recent Expenses */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-[#2C3E50]">Recent Expenses</Text>
            <TouchableOpacity>
              <Text className="text-[#3498DB] font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            {mockExpenses.map((expense) => (
              <View key={expense.id} className="flex-row items-center justify-between pb-3 border-b border-[#ECF0F1]">
                <View>
                  <Text className="font-bold text-[#2C3E50]">{expense.title}</Text>
                  <Text className="text-xs text-[#7F8C8D]">{expense.date}</Text>
                </View>
                <Text className="font-bold text-[#2C3E50]">
                  ₱{expense.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Chat Section */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
          <View className="flex-row items-center mb-4">
            <Bot size={24} color="#3498DB" />
            <Text className="text-lg font-bold text-[#2C3E50] ml-2">AI Expense Assistant</Text>
          </View>

          <View className="h-64 bg-[#F8F9FA] rounded-xl p-4 mb-4">
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            
            {isTyping && (
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 bg-[#3498DB] rounded-full mx-1"></View>
                <View className="w-2 h-2 bg-[#3498DB] rounded-full mx-1"></View>
                <View className="w-2 h-2 bg-[#3498DB] rounded-full mx-1"></View>
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
            <TouchableOpacity 
              className="bg-[#3498DB] rounded-full p-3"
              onPress={handleSendMessage}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}