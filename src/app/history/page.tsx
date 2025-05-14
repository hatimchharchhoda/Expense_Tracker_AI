// app/history/page.tsx
'use client'
import React, { useEffect, useState } from 'react';
import { Select, SelectItem } from "@nextui-org/select";
import { 
  Delete, 
  Calendar, 
  ArrowUpDown,
  Download, 
  Search, 
  PlusCircle, 
  Filter, 
  ListFilter, 
  Trash2,
  FileDown,
  ArrowDownUp
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useDispatch, useSelector } from 'react-redux';
import { filterOptions } from '@/constants/filterOptions';
import { login } from '@/store/authSlice';
import { PREDEFINED_CATEGORIES } from '@/models/model';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export interface AuthState {
  status: boolean;
  userData: any | null;
}

interface Transaction {
  _id: string;
  type: string;
  name: string;
  amount: number;
  color?: string;
  date: string;
  description?: string;
}

const timeFrameOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'Last Month' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'year', label: 'Last Year' }
];

export default function TransactionsHistoryPage() {
  const dispatch = useDispatch();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeFrame, setTimeFrame] = useState('all');
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const router = useRouter();
  const user = useSelector((state: { auth: AuthState }) => state.auth?.userData);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state to enable client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Statistics
  const totalTransactions = filtered.length;
  const totalAmount = filtered.reduce((sum, tx) => sum + tx.amount, 0);
  const incomeTotal = filtered
    .filter(tx => tx.type === 'Income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = filtered
    .filter(tx => tx.type !== 'Income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const filterByTimeFrame = (transactionsToFilter: Transaction[]) => {
    const now = new Date();
    const filterDate = new Date();

    switch (timeFrame) {
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactionsToFilter;
    }

    return transactionsToFilter.filter(t => new Date(t.date) >= filterDate);
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      setDownloadError('');

      if (!startDate || !endDate) {
        throw new Error('Please select both start and end dates');
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date must be before end date');
      }

      const response = await axios.post('/api/download_transaction', {
        userId: user.user._id,
        startDate,
        endDate,
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-${startDate}-to-${endDate}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: "Transactions downloaded successfully",
        variant: "default"
      });
    } catch (err: any) {
      setDownloadError(err.message);
      toast({
        title: 'Failed',
        description: "Failed to download transactions",
        variant: "destructive"
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDelete = async (transactionId: string, transactionAmount: number) => {
    setLoading(true);
    try {
      const del = await axios.post(`/api/delete-transaction/${transactionId}`, {
        userId: user.user._id,
        spent: transactionAmount
      });
      if (del.status === 200) {
        const updatedTransactions = transactions.filter(t => t._id !== transactionId);
        setTransactions(updatedTransactions);
        setFiltered(updatedTransactions);
        const updatedUser = {
          ...user,
          user: {
            ...user.user,
            spent: user.user.spent - transactionAmount
          }
        };
        dispatch(login(updatedUser));
        toast({
          title: 'Success',
          description: "Transaction Deleted",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: 'Failed',
        description: "Transaction not Deleted",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  useEffect(() => {
    let updatedTransactions = [...transactions];

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      updatedTransactions = updatedTransactions.filter(tx => 
        tx.name.toLowerCase().includes(searchLower) || 
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.type.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (selectedCategory !== "default") {
      updatedTransactions = updatedTransactions.filter(t => t.type === selectedCategory);
    }

    // Apply time frame filter
    updatedTransactions = filterByTimeFrame(updatedTransactions);

    // Apply sorting
    updatedTransactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFiltered(updatedTransactions);
  }, [timeFrame, selectedCategory, transactions, sortOrder, searchTerm]);

  const handleTimeFrameChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    setTimeFrame(event.target.value);
  };

  const handleCategoryChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    setSelectedCategory(event.target.value);
  };

  const clearFilters = () => {
    setSelectedCategory('default');
    setTimeFrame('all');
    setSearchTerm('');
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.post('/api/get-transaction', { user: user.user._id });
        const fetchedTransactions = response.data.data;
        setTransactions(fetchedTransactions);
        setFiltered(fetchedTransactions);
      } catch (error) {
        toast({
          title: 'Error',
          description: "Failed to fetch transactions",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.user?._id) {
      fetchTransactions();
    }
  }, [user?.user?._id, toast]);

  // Don't render UI until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 rounded-lg mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-[90px] rounded-xl" />
              <Skeleton className="h-[90px] rounded-xl" />
              <Skeleton className="h-[90px] rounded-xl" />
            </div>
          </div>
          
          <Skeleton className="h-16 w-full rounded-lg mb-4" />
          
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Title and Stats */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Transaction History</h1>
          
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ₹{totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${totalAmount >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {totalAmount >= 0 ? 
                    <ArrowUpDown className={`w-5 h-5 ${totalAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} /> : 
                    <ArrowUpDown className={`w-5 h-5 ${totalAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">From {totalTransactions} transactions</p>
            </div>
            
            <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{incomeTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <ArrowUpDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {filtered.filter(tx => tx.type === 'Income').length} income transactions
              </p>
            </div>
            
            <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    ₹{expenseTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <ArrowUpDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {filtered.filter(tx => tx.type !== 'Income').length} expense transactions
              </p>
            </div>
          </div> */}
        </div>
        
        {/* Filter and Actions Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border mb-6 overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-foreground">Transactions</h2>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <ListFilter className="w-4 h-4 mr-2" />
                  Filters {(selectedCategory !== 'default' || timeFrame !== 'all' || searchTerm.trim() !== '') && (
                    <Badge variant="secondary" className="ml-2">Active</Badge>
                  )}
                </Button>
                <Link href="/add-transaction">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className={`p-4 border-b border-border bg-accent/50 transition-all ${showFilterMenu ? 'block' : 'hidden'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-foreground mb-1.5">Search</div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search transactions..."
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-foreground mb-1.5">Category</div>
                <Select
                  selectedKeys={[selectedCategory]}
                  onChange={handleCategoryChange}
                >
                  {filterOptions.map((option) => (
                    <SelectItem key={option.key} value={option.label}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              
              <div>
                <div className="text-sm font-medium text-foreground mb-1.5">Time Period</div>
                <Select
                  selectedKeys={[timeFrame]}
                  onChange={handleTimeFrameChange}
                >
                  {timeFrameOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              
              <div>
                <div className="text-sm font-medium text-foreground mb-1.5">Sort Order</div>
                <Button 
                  variant="outline" 
                  onClick={toggleSortOrder}
                  className="w-full justify-between h-10"
                >
                  {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  <ArrowDownUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found
              </div>
              <div className="flex gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-sm h-9">
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2 text-foreground">
                        <Calendar className="w-4 h-4" />
                        Export Transactions
                      </h3>
                      
                      <div className="space-y-2">
                        <label htmlFor="startDate" className="text-sm font-medium text-foreground">
                          Start Date
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="endDate" className="text-sm font-medium text-foreground">
                          End Date
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>

                      {downloadError && (
                        <Alert variant="destructive">
                          <AlertDescription>{downloadError}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={handleDownload}
                        disabled={downloadLoading || !startDate || !endDate}
                        className="w-full"
                      >
                        {downloadLoading ? 'Exporting...' : 'Export Excel'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm h-9"
                  onClick={clearFilters}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
          
          {/* Transaction List */}
          <div className="max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-accent/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">No Transactions Found</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  {transactions.length > 0 
                    ? "No transactions match your current filters. Try adjusting your search criteria." 
                    : "Start adding transactions to see them here."}
                </p>
                {transactions.length === 0 ? (
                  <Link href="/add-transaction">
                    <Button 
                      className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Add Your First Transaction
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={clearFilters}
                    variant="outline" 
                    className="mt-6"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="hover:bg-accent/30 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Left: Transaction Info */}
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" 
                          style={{ backgroundColor: `${transaction.color}20` }}
                        >
                          <div 
                            className="w-5 h-5 rounded-full" 
                            style={{ backgroundColor: transaction.color }}
                          />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-foreground">{transaction.name}</h3>
                            {transaction.type === 'Income' ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border border-green-200 dark:border-green-900">
                                Income
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-accent border-border">
                                {transaction.type}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            
                            {transaction.description && (
                              <span className="text-xs text-muted-foreground max-w-md truncate">
                                {transaction.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Amount and Actions */}
                      <div className="flex items-center gap-6 ml-auto">
                        <div className={`text-lg font-medium ${
                          transaction.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'Income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })}
                        </div>
                        
                        <div className="flex items-center">
                          <button
                            className="text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(transaction._id, transaction.amount)}
                            disabled={loading}
                            aria-label="Delete transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination - Optional Footer */}
          {filtered.length > 0 && (
            <div className="p-4 border-t border-border bg-accent/50 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{filtered.length}</span> of{" "}
                <span className="font-medium">{transactions.length}</span> transactions
              </p>
              
              <Link href="/add-transaction">
                <Button variant="outline" size="sm" className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Export Suggestion Card */}
        <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-medium text-foreground text-lg">Need your transaction data?</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Export your transactions to Excel for use in spreadsheets or other financial tools.
            </p>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4" />
                  Export Transactions
                </h3>
                
                <div className="space-y-2">
                  <label htmlFor="startDateExport" className="text-sm font-medium text-foreground">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDateExport"
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="endDateExport" className="text-sm font-medium text-foreground">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDateExport"
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {downloadError && (
                  <Alert variant="destructive">
                    <AlertDescription>{downloadError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleDownload}
                  disabled={downloadLoading || !startDate || !endDate}
                  className="w-full"
                >
                  {downloadLoading ? 'Exporting...' : 'Export Excel'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
            