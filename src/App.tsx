import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  CalendarDays, 
  Goal, 
  Plus, 
  Bell, 
  HelpCircle,
  Search,
  Check,
  AlertCircle,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import { Transaction, LinkedAccount, BudgetCategory, SavingsGoal, UpcomingBill, CurrencyCode, CURRENCIES, formatMoney } from './types';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_ACCOUNTS, 
  INITIAL_BUDGET_CATEGORIES, 
  INITIAL_GOALS, 
  INITIAL_BILLS 
} from './mockData';

import OverviewTab from './components/OverviewTab';
import TransactionsTab from './components/TransactionsTab';
import BudgetTab from './components/BudgetTab';
import AccountsTab from './components/AccountsTab';

// Modals
import AddTransactionModal from './components/AddTransactionModal';
import LinkAccountModal from './components/LinkAccountModal';
import EditBudgetModal from './components/EditBudgetModal';
import AdvisoryModal from './components/AdvisoryModal';
import SettingsModal from './components/SettingsModal';

// Firebase core integration
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, onSnapshot, writeBatch, getDocFromServer } from 'firebase/firestore';

export default function App() {
  // Global Database State
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<CurrencyCode>('PKR');
  const selectedCurrency = CURRENCIES[selectedCurrencyCode] || CURRENCIES['PKR'];

  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [accounts, setAccounts] = useState<LinkedAccount[]>(INITIAL_ACCOUNTS);
  const [budgets, setBudgets] = useState<BudgetCategory[]>(INITIAL_BUDGET_CATEGORIES);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_GOALS);
  const [bills, setBills] = useState<UpcomingBill[]>(INITIAL_BILLS);

  const [isSyncing, setIsSyncing] = useState(false);

  // Auth User state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Custom User Profile State
  const [profile, setProfile] = useState<{ displayName: string; photoURL: string; emailNotifications?: boolean }>(() => {
    const savedName = localStorage.getItem('guest_displayName');
    const savedPhoto = localStorage.getItem('guest_photoURL');
    const savedEmailNotifs = localStorage.getItem('guest_emailNotifications');
    return {
      displayName: savedName || 'Guest User',
      photoURL: savedPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      emailNotifications: savedEmailNotifs === 'true',
    };
  });

  // Authentication controllers
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Google Sign Out Error:', error);
    }
  };

  const handleCurrencyCodeChange = async (newCode: CurrencyCode) => {
    setSelectedCurrencyCode(newCode);
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { userId, selectedCurrencyCode: newCode, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
      }
    }
  };

  const handleSaveProfile = async (updatedProfile: { displayName: string; photoURL: string; emailNotifications: boolean }) => {
    setProfile(updatedProfile);
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { 
          displayName: updatedProfile.displayName, 
          photoURL: updatedProfile.photoURL,
          emailNotifications: updatedProfile.emailNotifications,
          updatedAt: new Date().toISOString() 
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
      }
    } else {
      localStorage.setItem('guest_displayName', updatedProfile.displayName);
      localStorage.setItem('guest_photoURL', updatedProfile.photoURL);
      localStorage.setItem('guest_emailNotifications', String(updatedProfile.emailNotifications));
    }
  };

  // Setup real-time listeners and database seeding
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubTx: (() => void) | null = null;
    let unsubAcc: (() => void) | null = null;
    let unsubBudgets: (() => void) | null = null;
    let unsubGoals: (() => void) | null = null;
    let unsubBills: (() => void) | null = null;

    const cleanUpSubscriptions = () => {
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (unsubTx) { unsubTx(); unsubTx = null; }
      if (unsubAcc) { unsubAcc(); unsubAcc = null; }
      if (unsubBudgets) { unsubBudgets(); unsubBudgets = null; }
      if (unsubGoals) { unsubGoals(); unsubGoals = null; }
      if (unsubBills) { unsubBills(); unsubBills = null; }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Always clear any previous subscriptions when auth state moves or changes
      cleanUpSubscriptions();

      setCurrentUser(fbUser);
      setAuthLoading(false);

      if (fbUser) {
        const userId = fbUser.uid;
        const userDocRef = doc(db, 'users', userId);
        let userProfileExists = false;

        try {
          // Verify if user account was already seeded
          const userSnap = await getDocFromServer(userDocRef);
          userProfileExists = userSnap.exists();
        } catch (e) {
          console.warn('Could not read user profile from server:', e);
        }

        if (!userProfileExists) {
          // First time user registration: Seed baseline values
          try {
            const batch = writeBatch(db);
            batch.set(userDocRef, {
              userId,
              selectedCurrencyCode,
              updatedAt: new Date().toISOString()
            });

            accounts.forEach((acc) => {
              const ref = doc(db, `users/${userId}/accounts`, acc.id);
              batch.set(ref, { ...acc, userId });
            });

            transactions.forEach((tx) => {
              const ref = doc(db, `users/${userId}/transactions`, tx.id);
              batch.set(ref, { ...tx, userId });
            });

            budgets.forEach((bd) => {
              const ref = doc(db, `users/${userId}/budgets`, bd.id);
              batch.set(ref, { ...bd, userId });
            });

            goals.forEach((gl) => {
              const ref = doc(db, `users/${userId}/goals`, gl.id);
              batch.set(ref, { ...gl, userId });
            });

            bills.forEach((bl) => {
              const ref = doc(db, `users/${userId}/bills`, bl.id);
              batch.set(ref, { ...bl, userId });
            });

            await batch.commit();
          } catch (seedErr) {
            console.error('Failed to seed user database during registration:', seedErr);
          }
        }

        // Establish reactive content subscriptions
        unsubUser = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.selectedCurrencyCode) {
              setSelectedCurrencyCode(data.selectedCurrencyCode);
            }
            setProfile({
              displayName: data.displayName || fbUser.displayName || 'Google User',
              photoURL: data.photoURL || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              emailNotifications: data.emailNotifications ?? false,
            });
          } else {
            setProfile({
              displayName: fbUser.displayName || 'Google User',
              photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              emailNotifications: false,
            });
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userId}`);
        });

        unsubTx = onSnapshot(collection(db, `users/${userId}/transactions`), (snapshot) => {
          const loaded: Transaction[] = [];
          snapshot.forEach((doc) => {
            loaded.push(doc.data() as Transaction);
          });
          loaded.sort((a, b) => b.date.localeCompare(a.date));
          setTransactions(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userId}/transactions`);
        });

        unsubAcc = onSnapshot(collection(db, `users/${userId}/accounts`), (snapshot) => {
          const loaded: LinkedAccount[] = [];
          snapshot.forEach((doc) => {
            loaded.push(doc.data() as LinkedAccount);
          });
          setAccounts(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userId}/accounts`);
        });

        unsubBudgets = onSnapshot(collection(db, `users/${userId}/budgets`), (snapshot) => {
          const loaded: BudgetCategory[] = [];
          snapshot.forEach((doc) => {
            loaded.push(doc.data() as BudgetCategory);
          });
          setBudgets(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userId}/budgets`);
        });

        unsubGoals = onSnapshot(collection(db, `users/${userId}/goals`), (snapshot) => {
          const loaded: SavingsGoal[] = [];
          snapshot.forEach((doc) => {
            loaded.push(doc.data() as SavingsGoal);
          });
          setGoals(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userId}/goals`);
        });

        unsubBills = onSnapshot(collection(db, `users/${userId}/bills`), (snapshot) => {
          const loaded: UpcomingBill[] = [];
          snapshot.forEach((doc) => {
            loaded.push(doc.data() as UpcomingBill);
          });
          loaded.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          setBills(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userId}/bills`);
        });
      } else {
        // Guest mode fallback
        setTransactions(INITIAL_TRANSACTIONS);
        setAccounts(INITIAL_ACCOUNTS);
        setBudgets(INITIAL_BUDGET_CATEGORIES);
        setGoals(INITIAL_GOALS);
        setBills(INITIAL_BILLS);
        setSelectedCurrencyCode('PKR');
        const savedName = localStorage.getItem('guest_displayName') || 'Guest User';
        const savedPhoto = localStorage.getItem('guest_photoURL') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
        const savedEmailNotifs = localStorage.getItem('guest_emailNotifications') === 'true';
        setProfile({ displayName: savedName, photoURL: savedPhoto, emailNotifications: savedEmailNotifs });
      }
    });

    return () => {
      unsubscribeAuth();
      cleanUpSubscriptions();
    };
  }, []);

  // Layout navigation: 0 = Overview, 1 = Transactions Ledger, 2 = Budget Planner, 3 = Accounts & Goals
  const [activeTab, setActiveTab] = useState(0);

  // Modals Visibility
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isLinkAccOpen, setIsLinkAccOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [isAdvisoryOpen, setIsAdvisoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global State Modifiers
  const handleAddTransaction = async (newTx: Transaction) => {
    if (!auth.currentUser) {
      // Offline fallback
      setTransactions((prev) => [newTx, ...prev]);
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          if (acc.name === newTx.account) {
            return { ...acc, balance: acc.balance + newTx.amount };
          }
          return acc;
        })
      );
      setBudgets((prevBudgets) =>
        prevBudgets.map((b) => {
          const isMatch = b.name.toLowerCase() === newTx.category.toLowerCase() ||
                          (b.name === 'Groceries' && newTx.category === 'Food & Dining');
          if (isMatch && newTx.amount < 0) {
            return {
              ...b,
              currentSpent: b.currentSpent + Math.abs(newTx.amount),
            };
          }
          return b;
        })
      );
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);

      // 1. Write the new Transaction document in the subcollection
      const txRef = doc(db, `users/${userId}/transactions`, newTx.id);
      batch.set(txRef, { ...newTx, userId });

      // 2. Adjust target account balance
      const targetAccount = accounts.find(a => a.name === newTx.account);
      if (targetAccount) {
        const accRef = doc(db, `users/${userId}/accounts`, targetAccount.id);
        batch.update(accRef, { balance: targetAccount.balance + newTx.amount });
      }

      // 3. Adjust matching budget spends
      const matchedBudget = budgets.find(b => b.name.toLowerCase() === newTx.category.toLowerCase() || (b.name === 'Groceries' && newTx.category === 'Food & Dining'));
      if (matchedBudget && newTx.amount < 0) {
        const budgetRef = doc(db, `users/${userId}/budgets`, matchedBudget.id);
        batch.update(budgetRef, { currentSpent: matchedBudget.currentSpent + Math.abs(newTx.amount) });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    if (!auth.currentUser) {
      // Offline fallback
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          if (acc.name === txToDelete.account) {
            return { ...acc, balance: acc.balance - txToDelete.amount };
          }
          return acc;
        })
      );
      setBudgets((prevBudgets) =>
        prevBudgets.map((b) => {
          const isMatch = b.name.toLowerCase() === txToDelete.category.toLowerCase() ||
                          (b.name === 'Groceries' && txToDelete.category === 'Food & Dining');
          if (isMatch && txToDelete.amount < 0) {
            return {
              ...b,
              currentSpent: Math.max(0, b.currentSpent - Math.abs(txToDelete.amount)),
            };
          }
          return b;
        })
      );
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);

      // 1. Delete document
      const txRef = doc(db, `users/${userId}/transactions`, id);
      batch.delete(txRef);

      // 2. Refund corresponding account balance
      const targetAccount = accounts.find(a => a.name === txToDelete.account);
      if (targetAccount) {
        const accRef = doc(db, `users/${userId}/accounts`, targetAccount.id);
        batch.update(accRef, { balance: targetAccount.balance - txToDelete.amount });
      }

      // 3. Refund corresponding budget Spent
      const matchedBudget = budgets.find(b => b.name.toLowerCase() === txToDelete.category.toLowerCase() || (b.name === 'Groceries' && txToDelete.category === 'Food & Dining'));
      if (matchedBudget && txToDelete.amount < 0) {
        const budgetRef = doc(db, `users/${userId}/budgets`, matchedBudget.id);
        batch.update(budgetRef, { currentSpent: Math.max(0, matchedBudget.currentSpent - Math.abs(txToDelete.amount)) });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleLinkAccount = async (newAcc: LinkedAccount) => {
    if (!auth.currentUser) {
      setAccounts((prev) => [...prev, newAcc]);
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const accRef = doc(db, `users/${userId}/accounts`, newAcc.id);
      await setDoc(accRef, { ...newAcc, userId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/accounts/${newAcc.id}`);
    }
  };

  const handleUpdateBudget = async (updated: BudgetCategory[]) => {
    if (!auth.currentUser) {
      setBudgets(updated);
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      for (const cat of updated) {
        const budgetRef = doc(db, `users/${userId}/budgets`, cat.id);
        batch.set(budgetRef, { ...cat, userId });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/budgets`);
    }
  };

  const handleUpdateBill = async (billId: string, updatedFields: Partial<UpcomingBill>) => {
    if (!auth.currentUser) {
      setBills((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, ...updatedFields } : b))
      );
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const billRef = doc(db, `users/${userId}/bills`, billId);
      await updateDoc(billRef, updatedFields);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/bills/${billId}`);
    }
  };

  const handlePayBill = async (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    const category: string = bill.title.toLowerCase().includes('rent') ? 'Rent & Housing' : 'Entertainment';
    const txId = `tx-bill-${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
      title: bill.title,
      description: `Bill Payment - ${bill.category}`,
      category,
      amount: -bill.amount,
      date: new Date().toISOString().split('T')[0],
      account: 'Main Checking',
    };

    if (!auth.currentUser) {
      handleAddTransaction(newTx);
      setBills((prev) => prev.filter((b) => b.id !== billId));
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);

      // 1. Delete the paid upcoming bill
      const billRef = doc(db, `users/${userId}/bills`, billId);
      batch.delete(billRef);

      // 2. Add the corresponding transaction
      const txRef = doc(db, `users/${userId}/transactions`, txId);
      batch.set(txRef, { ...newTx, userId });

      // 3. Deduct transaction balance from standard liquid account ("Main Checking")
      const mainChecking = accounts.find(a => a.name === 'Main Checking');
      if (mainChecking) {
        const accRef = doc(db, `users/${userId}/accounts`, mainChecking.id);
        batch.update(accRef, { balance: mainChecking.balance - bill.amount });
      }

      // 4. Update core matching slots
      const matchedBudget = budgets.find(b => b.name.toLowerCase() === category.toLowerCase() || (b.name === 'Groceries' && category === 'Food & Dining'));
      if (matchedBudget) {
        const budgetRef = doc(db, `users/${userId}/budgets`, matchedBudget.id);
        batch.update(budgetRef, { currentSpent: matchedBudget.currentSpent + bill.amount });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleContributeToGoal = async (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    if (!auth.currentUser) {
      // Offline fallback
      setAccounts((prevAccounts) => {
        const mainChecking = prevAccounts.find((a) => a.name === 'Main Checking');
        if (mainChecking && mainChecking.balance >= amount) {
          return prevAccounts.map((a) =>
            a.name === 'Main Checking' ? { ...a, balance: a.balance - amount } : a
          );
        }
        return prevAccounts;
      });
      setGoals((prevGoals) =>
        prevGoals.map((g) =>
          g.id === goalId ? { ...g, currentSaved: Math.min(g.targetSaved, g.currentSaved + amount) } : g
        )
      );
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);

      // 1. Check account balance
      const mainChecking = accounts.find(a => a.name === 'Main Checking');
      if (mainChecking && mainChecking.balance >= amount) {
        const accRef = doc(db, `users/${userId}/accounts`, mainChecking.id);
        batch.update(accRef, { balance: mainChecking.balance - amount });
      }

      // 2. Increment saved goals metrics
      const goalRef = doc(db, `users/${userId}/goals`, goalId);
      batch.update(goalRef, { currentSaved: Math.min(goal.targetSaved, goal.currentSaved + amount) });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleAddBudgetCategory = async (newCat: Omit<BudgetCategory, 'id' | 'currentSpent'>) => {
    const freshId = `cat-${Date.now()}`;
    const freshCat: BudgetCategory = {
      ...newCat,
      id: freshId,
      currentSpent: 0,
    };

    if (!auth.currentUser) {
      setBudgets((prev) => [...prev, freshCat]);
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const budgetRef = doc(db, `users/${userId}/budgets`, freshId);
      await setDoc(budgetRef, { ...freshCat, userId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/budgets/${freshId}`);
    }
  };

  const handleSyncAccounts = async () => {
    setIsSyncing(true);

    if (!auth.currentUser) {
      // Offline simulation
      setTimeout(() => {
        setAccounts((prevAccounts) =>
          prevAccounts.map((acc) => {
            const newLast4 = Math.floor(1000 + Math.random() * 9000).toString();
            const latency = Math.floor(45 + Math.random() * 85);
            return {
              ...acc,
              last4: newLast4,
              syncTime: `Updated just now (${latency}ms ping)`,
            };
          })
        );
        setIsSyncing(false);
      }, 1500);
      return;
    }

    const userId = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      for (const acc of accounts) {
        const newLast4 = Math.floor(1000 + Math.random() * 9000).toString();
        const latency = Math.floor(45 + Math.random() * 85);
        const accRef = doc(db, `users/${userId}/accounts`, acc.id);
        batch.update(accRef, {
          last4: newLast4,
          syncTime: `Updated just now (${latency}ms ping)`,
        });
      }
      await batch.commit();
      setIsSyncing(false);
    } catch (error) {
      setIsSyncing(false);
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/accounts`);
    }
  };

  // Derive global numerical stats dynamically from current lists!
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const categoriesList = Array.from(new Set([
    ...budgets.map((b) => b.name),
    'Salary',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Automotive',
    'Food & Dining'
  ]));

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen font-sans selection:bg-secondary-container">
      
      {/* Sidebar Navigation - Visible on Desktop screens */}
      <aside className="hidden md:flex flex-col h-full py-6 px-4 bg-surface-container-lowest border-r border-outline-variant fixed left-0 top-0 w-64 z-55">
        
        {/* Logo and Brand Title */}
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold text-primary tracking-tight">Mr Budget</h1>
          <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mt-0.5 opacity-75">
            Financial Control
          </p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab(0)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer ${
              activeTab === 0
                ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/15 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="font-sans">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer ${
              activeTab === 1
                ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/15 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            <ReceiptText className="w-5 h-5 shrink-0" />
            <span className="font-sans">Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(2)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer ${
              activeTab === 2
                ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/15 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            <CalendarDays className="w-5 h-5 shrink-0" />
            <span className="font-sans">Budget Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(3)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer ${
              activeTab === 3
                ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/15 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            <Goal className="w-5 h-5 shrink-0" />
            <span className="font-sans">Accounts &amp; Goals</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="font-sans">Settings &amp; Profile</span>
          </button>
        </nav>

        {/* Global actions at bottom */}
        <div className="mt-auto pt-6 px-2 flex flex-col gap-4 border-t border-outline-variant/65">
          <button
            type="button"
            onClick={() => setIsAddTxOpen(true)}
            className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm border border-primary/10"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>

          {/* Firebase Database Sync Panel */}
          <div>
            {currentUser ? (
              <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 flex flex-col gap-2">
                <div 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 group"
                  title="Click to edit profile"
                >
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-8 h-8 rounded-full border border-primary/20 bg-surface-container object-cover group-hover:border-primary transition-colors"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-primary truncate leading-tight flex items-center gap-1 group-hover:text-primary-container">
                      {profile.displayName}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/80 truncate font-mono">
                      Cloud Synced
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[10px] font-semibold py-1.5 rounded-lg border border-outline-variant/30 cursor-pointer transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="bg-primary/5 hover:bg-primary/[0.08] border border-primary/15 rounded-xl p-3 flex flex-col gap-2 transition-all">
                <div onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 cursor-pointer hover:opacity-90 group" title="Click to configure settings">
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-6 h-6 rounded-lg border border-primary/10 object-cover"
                  />
                  <p className="text-[11px] font-bold text-primary truncate leading-tight flex-1">
                    {profile.displayName} (Guest)
                  </p>
                </div>
                <p className="text-[9px] font-medium text-primary/80 leading-snug">
                  Save your financial logs to secure cloud servers automatically.
                </p>
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="w-full bg-primary hover:opacity-95 text-white font-bold py-2 rounded-lg text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm border border-primary/10"
                >
                  🔑 Google Cloud Backup
                </button>
              </div>
            )}
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen flex flex-col justify-between">
        
        {/* Top AppBar Section */}
        <header className="flex justify-between items-center px-4 md:px-8 w-full h-16 sticky top-0 z-40 bg-white border-b border-outline-variant">
          
          <div className="flex items-center gap-6 flex-1 max-w-lg min-w-0">
            {/* Page Tab indicator inside header for visual polish */}
            <h2 className="hidden sm:block text-base font-bold text-primary shrink-0">
              {activeTab === 0 && 'Overview'}
              {activeTab === 1 && 'Ledger List'}
              {activeTab === 2 && 'Planner'}
              {activeTab === 3 && 'Liquidity Suite'}
            </h2>

            {/* Simulated Search bar */}
            <div className="flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant w-full max-w-xs focus-within:border-primary transition-colors">
              <Search className="w-4 h-4 text-outline shrink-0" />
              <input
                type="text"
                placeholder="Search accounts..."
                onClick={() => { if (activeTab !== 1) setActiveTab(1); }}
                className="bg-transparent border-none text-xs w-full pl-2 placeholder:text-outline text-primary font-medium"
              />
            </div>
          </div>

          {/* Quick Info Alerts notifications & Profiles */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Currency Selector */}
            <div className="relative">
              <select
                id="currency-selector"
                value={selectedCurrencyCode}
                onChange={(e) => handleCurrencyCodeChange(e.target.value as CurrencyCode)}
                className="bg-surface-container-low text-xs font-bold text-primary pl-3 pr-8 py-1.5 rounded-full border border-outline-variant focus:outline-none focus:border-primary appearance-none cursor-pointer transition-colors hover:bg-surface-container-high h-[36px] min-w-[110px]"
                title="Select Base Currency"
              >
                <option value="USD">🇺🇸 USD ($)</option>
                <option value="EUR">🇪🇺 EUR (€)</option>
                <option value="PKR">🇵🇰 PKR (₨)</option>
                <option value="BHD">🇧🇭 BHD (BD)</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[8px] font-bold">▼</span>
            </div>

            {/* Stats notification shortcuts */}
            <button
              type="button"
              onClick={() => setIsAdvisoryOpen(true)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer relative"
              title="Alert Notifications"
            >
              <Bell className="w-5 h-5 text-on-surface-variant" />
              {/* Pulse status indicator */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse"></span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdvisoryOpen(true)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
              title="Wealth Advisory AI help"
            >
              <HelpCircle className="w-5 h-5 text-on-surface-variant" />
            </button>

            {/* Real user or Sign In status on mobile toolbar */}
            <div className="flex items-center gap-2">
              <span className="hidden leading-none text-right sm:block">
                <p className="text-[10px] font-bold text-primary truncate leading-tight max-w-[100px]">
                  {profile.displayName}
                </p>
                {currentUser ? (
                  <p className="text-[8px] text-emerald-600 font-bold tracking-wider uppercase font-mono">Synced</p>
                ) : (
                  <p className="text-[8px] text-on-surface-variant/75 font-bold tracking-wider uppercase font-mono">Offline</p>
                )}
              </span>
              <div 
                onClick={() => setIsSettingsOpen(true)}
                title="App Settings &amp; Profile"
                className="h-8 w-8 rounded-full overflow-hidden border border-primary/30 bg-surface-container cursor-pointer hover:border-primary hover:scale-105 active:scale-95 transition-all duration-150 object-cover shrink-0"
              >
                <img 
                  alt="User Profile" 
                  className="w-full h-full object-cover select-none"
                  src={profile.photoURL}
                />
              </div>
            </div>
          </div>

        </header>

        {/* Tab Canvas Content area */}
        <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full mb-16 md:mb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              {activeTab === 0 && (
                <OverviewTab
                  totalBalance={totalBalance}
                  budgets={budgets}
                  bills={bills}
                  recentTransactions={transactions.slice(0, 4)}
                  onAnalyze={() => setIsAdvisoryOpen(true)}
                  onNavigateToTab={setActiveTab}
                  onPayBill={handlePayBill}
                  onAddTransactionClick={() => setIsAddTxOpen(true)}
                  selectedCurrency={selectedCurrency}
                  onUpdateBill={handleUpdateBill}
                />
              )}

              {activeTab === 1 && (
                <TransactionsTab
                  transactions={transactions}
                  accounts={accounts}
                  categories={categoriesList}
                  onDeleteTransaction={handleDeleteTransaction}
                  onAddTransactionClick={() => setIsAddTxOpen(true)}
                  selectedCurrency={selectedCurrency}
                />
              )}

              {activeTab === 2 && (
                <BudgetTab
                  budgets={budgets}
                  onEditBudgetClick={() => setIsEditBudgetOpen(true)}
                  onAddCategory={handleAddBudgetCategory}
                  onOpenAdvisor={() => setIsAdvisoryOpen(true)}
                  selectedCurrency={selectedCurrency}
                />
              )}

              {activeTab === 3 && (
                <AccountsTab
                  accounts={accounts}
                  goals={goals}
                  onLinkAccountClick={() => setIsLinkAccOpen(true)}
                  onContributeToGoal={handleContributeToGoal}
                  onOpenAdvisor={() => setIsAdvisoryOpen(true)}
                  selectedCurrency={selectedCurrency}
                  onSyncAccounts={handleSyncAccounts}
                  isSyncing={isSyncing}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Floating Action Button - Desktop Quick actions shortcut */}
      <button 
        type="button"
        onClick={() => setIsAddTxOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 bg-primary hover:bg-primary-container text-white w-14 h-14 rounded-full shadow-2xl items-center justify-center z-45 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/10"
        title="Add transaction logs"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation for mobile screens only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-outline-variant flex items-center justify-around px-4 z-45">
        
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 0 ? 'text-primary font-bold' : 'text-on-surface-variant opacity-70'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 1 ? 'text-primary font-bold' : 'text-on-surface-variant opacity-70'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Ledger</span>
        </button>

        {/* Floating Add trigger on mobile */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={() => setIsAddTxOpen(true)}
            className="bg-primary text-white h-11 w-11 rounded-full shadow-lg flex items-center justify-center cursor-pointer border border-white/10"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 2 ? 'text-primary font-bold' : 'text-on-surface-variant opacity-70'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Budget</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(3)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 3 ? 'text-primary font-bold' : 'text-on-surface-variant opacity-70'
          }`}
        >
          <Goal className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Goals</span>
        </button>

      </nav>

      {/* Global Modals Portal */}
      <AnimatePresence>
        
        {/* Add Transaction */}
        {isAddTxOpen && (
          <AddTransactionModal
            isOpen={isAddTxOpen}
            onClose={() => setIsAddTxOpen(false)}
            onAdd={handleAddTransaction}
            accounts={accounts}
            categories={categoriesList}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Link Bank Account */}
        {isLinkAccOpen && (
          <LinkAccountModal
            isOpen={isLinkAccOpen}
            onClose={() => setIsLinkAccOpen(false)}
            onLink={handleLinkAccount}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Edit Budget Limits */}
        {isEditBudgetOpen && (
          <EditBudgetModal
            isOpen={isEditBudgetOpen}
            onClose={() => setIsEditBudgetOpen(false)}
            budgets={budgets}
            onUpdate={handleUpdateBudget}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Advanced Wealth Advisor Report Diagnostics */}
        {isAdvisoryOpen && (
          <AdvisoryModal
            isOpen={isAdvisoryOpen}
            onClose={() => setIsAdvisoryOpen(false)}
            transactions={transactions}
            accounts={accounts}
            budgets={budgets}
            goals={goals}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Global App Profile / Preferences Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentUser={currentUser}
            profile={profile}
            selectedCurrencyCode={selectedCurrencyCode}
            onSaveProfile={handleSaveProfile}
            onCurrencyChange={handleCurrencyCodeChange}
            onSignOut={handleSignOut}
            onSignIn={handleSignIn}
          />
        )}

      </AnimatePresence>

    </div>
  );
}
