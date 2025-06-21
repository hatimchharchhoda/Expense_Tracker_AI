'use client'

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit3, 
  Save, 
  X, 
  ArrowLeft,
  Wallet,
  TrendingUp,
  Target,
  ListOrdered,
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { login } from '@/store/authSlice';
import axios from 'axios';

export interface AuthState {
  status: boolean;
  userData: any | null;
}

interface UserStats {
  totalTransactions: number;
  totalSpent: number;
  totalIncome: number;
  currentBudget: number;
}

function ProfilePage() {
  const { data: session } = useSession();
  const user = useSelector((state: { auth: AuthState }) => state.auth?.userData);
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalTransactions: 0,
    totalSpent: 0,
    totalIncome: 0,
    currentBudget: 0
  });
  
  const [editForm, setEditForm] = useState({
    username: '',
    budget: 0
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize form with user data
  useEffect(() => {
    if (user?.user) {
      setEditForm({
        username: user.user.username || '',
        budget: user.user.budget || 0
      });
    }
  }, [user]);

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.user?._id) return;
      
      try {
        setStatsLoading(true);
        const response = await axios.post('/api/get-transaction', { 
          user: user.user._id 
        });
        
        const transactions = response.data.data || [];
        
        const stats = transactions.reduce((acc: UserStats, transaction: any) => {
          acc.totalTransactions++;
          if (transaction.type === 'Income') {
            acc.totalIncome += transaction.amount;
          } else {
            acc.totalSpent += transaction.amount;
          }
          return acc;
        }, {
          totalTransactions: 0,
          totalSpent: 0,
          totalIncome: 0,
          currentBudget: user.user.budget || 0
        });
        
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        toast({
          title: "Error",
          description: "Failed to load user statistics",
          variant: "destructive"
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [user?.user?._id, user?.user?.budget, toast]);

  const handleSave = async () => {
    if (!user?.user?._id) return;
    
    setLoading(true);
    try {
      const response = await axios.put('/api/update-profile', {
        userId: user.user._id,
        username: editForm.username,
        budget: editForm.budget
      });

      if (response.status === 200) {
        // Update the user data in Redux
        const updatedUserData = {
          ...user,
          user: {
            ...user.user,
            username: editForm.username,
            budget: editForm.budget
          }
        };
        
        dispatch(login(updatedUserData));
        
        // Update localStorage
        localStorage.setItem('session', JSON.stringify(updatedUserData));
        
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user?.user) {
      setEditForm({
        username: user.user.username || '',
        budget: user.user.budget || 0
      });
    }
    setIsEditing(false);
  };

  if (!mounted) {
    return null;
  }

  if (!user?.user) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard" 
            className="flex items-center px-3 py-2 rounded-full bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your account information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Profile Information
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 dark:bg-blue-500/10 flex items-center justify-center border-4 border-blue-500/30">
                      <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    {user.user.isGoogleUser && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -bottom-2 -right-2 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                      >
                        Google
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {user.user.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.user.isGoogleUser ? 'Google Account' : 'Local Account'}
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          username: e.target.value
                        }))}
                        placeholder="Enter username"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-accent/50 rounded-md text-foreground">
                        {user.user.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <p className="px-3 py-2 bg-accent/50 rounded-md text-muted-foreground">
                      {user.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(user.expires).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            <Card className="shadow-sm border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Account Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-sm font-medium text-foreground">Total Transactions</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {userStats.totalTransactions}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm font-medium text-foreground">Total Income</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₹{userStats.totalIncome.toLocaleString('en-IN')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="text-sm font-medium text-foreground">Total Spent</span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        ₹{userStats.totalSpent.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <Wallet className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                                <Link href="/add-transaction">
                  <Button variant="outline" className="w-full justify-start">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </Link>
                
                <Link href="/budget">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="mr-2 h-4 w-4" />
                    Manage Budget
                  </Button>
                </Link>
                
                <Link href="/history">
                  <Button variant="outline" className="w-full justify-start">
                    <ListOrdered className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;