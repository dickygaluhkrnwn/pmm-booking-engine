// src/app/rewards/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Loader2, Sparkles, Gift, ShieldCheck, 
  Ticket, Crown, CheckCircle2, AlertCircle, Clock, 
  Tag, Star, Gem
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DashboardHeader } from '@/components/layout/DashboardHeader'; 

// --- PEMETAAN IKON DINAMIS ---
const ICON_MAP: Record<string, any> = {
  Ticket, Gift, Crown, Tag, Star, Gem
};

// --- EXPANDED FALLBACK CATALOG (MAX 500K) ---
const FALLBACK_CATALOG = [
  { id: 'VOUCHER-50K', name: 'IDR 50,000 Discount', desc: 'A quick treat. Applicable to any booking without restrictions.', cost: 5, value: 50000, iconName: 'Ticket' },
  { id: 'VOUCHER-100K', name: 'IDR 100,000 Discount', desc: 'Perfect for Sharing Deck Upstair. Enjoy the ocean breeze for less.', cost: 10, value: 100000, iconName: 'Tag' },
  { id: 'VOUCHER-150K', name: 'IDR 150,000 Discount', desc: 'Ideal for Down Deck Cabin (1 Pax). Solo travel made sweeter.', cost: 15, value: 150000, iconName: 'Gift' },
  { id: 'VOUCHER-250K', name: 'IDR 250,000 Discount', desc: 'Best value for Down Deck Cabin (2 Pax). Upgrade your comfort.', cost: 25, value: 250000, iconName: 'Star' },
  { id: 'VOUCHER-350K', name: 'IDR 350,000 Discount', desc: 'Premium savings. Recommended for Private Cabin Standard.', cost: 35, value: 350000, iconName: 'Gem' },
  { id: 'VOUCHER-500K', name: 'VVIP IDR 500,000 Discount', desc: 'Maximum Limit Voucher! Highly recommended for Private Sea View.', cost: 50, value: 500000, iconName: 'Crown' },
];

export default function RewardsPage() {
  const router = useRouter();
  
  // States
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-vouchers'>('catalog');
  
  // Loading States
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Modal States
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [modalState, setModalState] = useState<'confirm' | 'success' | 'error'>('confirm');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Cek Autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data Poin, Katalog Admin, & Voucher User
  useEffect(() => {
    const fetchRewardsData = async () => {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());

        const catalogSnap = await getDocs(collection(db, 'rewards_catalog'));
        if (!catalogSnap.empty) {
          const fetchedCatalog = catalogSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedCatalog.sort((a: any, b: any) => a.cost - b.cost);
          setCatalog(fetchedCatalog);
        } else {
          setCatalog(FALLBACK_CATALOG);
        }

        const rewardsRef = collection(db, 'user_rewards');
        const q = query(rewardsRef, where('userId', '==', user.uid));
        const rewardsSnap = await getDocs(q);
        const vouchers: any[] = [];
        rewardsSnap.forEach(doc => {
          vouchers.push({ id: doc.id, ...doc.data() });
        });
        
        vouchers.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
        setMyVouchers(vouchers);

      } catch (error) {
        console.error("Error fetching rewards data:", error);
        if (catalog.length === 0) setCatalog(FALLBACK_CATALOG);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchRewardsData();
  }, [user]);

  // 3. Proses Penukaran Poin via API
  const handleRedeem = async () => {
    if (!user || !selectedReward) return;
    setIsRedeeming(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          rewardId: selectedReward.id,
          rewardName: selectedReward.name,
          cost: selectedReward.cost,
          discountValue: selectedReward.value
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setUserData((prev: any) => ({ ...prev, pointsBalance: prev.pointsBalance - selectedReward.cost }));
      setMyVouchers(prev => [{
        id: 'new-' + Date.now(),
        rewardName: selectedReward.name,
        discountValue: selectedReward.value,
        status: 'ACTIVE',
        redeemedAt: new Date().toISOString()
      }, ...prev]);

      setModalState('success');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to redeem points.');
      setModalState('error');
    } finally {
      setIsRedeeming(false);
    }
  };

  const openRedeemModal = (reward: any) => {
    setSelectedReward(reward);
    setModalState('confirm');
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center selection:bg-gold selection:text-navy">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center text-center px-4 relative overflow-hidden selection:bg-gold selection:text-navy">
        <DashboardHeader /> 
        <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=2000&auto=format&fit=crop")' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-md mt-20">
          <div className="w-24 h-24 bg-white/10 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-8 backdrop-blur-sm shadow-xl">
            <Crown className="w-12 h-12 text-gold" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">VVIP Rewards</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">Exclusive discounts up to IDR 500,000 for our esteemed members. Please sign in to view your balance and redeem vouchers.</p>
          <button onClick={() => router.push('/login')} className="w-full bg-gold text-navy hover:bg-[#b8972e] py-4 rounded-2xl font-bold shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
            Sign In to Member Portal <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-gold selection:text-navy pb-24 pt-24">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-navy rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden mb-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Rewards Club</h1>
              <p className="text-gray-400 max-w-md leading-relaxed text-sm md:text-base">Exchange your Gold Points for luxury cabin discounts. Our vouchers are dynamically updated to give you the best deals across the archipelago.</p>
            </div>
            
            <div className="bg-white/10 border border-white/20 p-6 md:p-8 rounded-[2rem] backdrop-blur-md flex items-center gap-6 min-w-[280px] justify-center shadow-inner">
              <div className="bg-gold/20 p-4 rounded-full border border-gold/30">
                <Sparkles className="w-8 h-8 text-gold" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Available Balance</p>
                {isLoadingData ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gold mt-2" />
                ) : (
                  <p className="text-4xl font-extrabold text-gold">{userData?.pointsBalance || 0} <span className="text-lg font-bold text-white">Pts</span></p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-max mx-auto sm:mx-0">
          <button 
            onClick={() => setActiveTab('catalog')} 
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all w-full sm:w-auto ${activeTab === 'catalog' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Reward Catalog
          </button>
          <button 
            onClick={() => setActiveTab('my-vouchers')} 
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all w-full sm:w-auto ${activeTab === 'my-vouchers' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            My Active Vouchers
          </button>
        </div>

        <AnimatePresence mode="wait">
          
          {activeTab === 'catalog' && (
            <motion.div key="catalog" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalog.map((reward) => {
                const Icon = ICON_MAP[reward.iconName] || Ticket;
                const canAfford = (userData?.pointsBalance || 0) >= reward.cost;

                return (
                  <div key={reward.id} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl border border-gray-100 transition-all flex flex-col group hover:-translate-y-1.5">
                    <div className="w-14 h-14 bg-gray-50 group-hover:bg-gold/10 rounded-2xl flex items-center justify-center mb-5 transition-colors border border-gray-100 group-hover:border-gold/30 shadow-sm">
                      <Icon className="w-6 h-6 text-navy group-hover:text-gold transition-colors" />
                    </div>
                    <h3 className="text-xl font-extrabold text-navy mb-2">{reward.name}</h3>
                    <p className="text-xs text-gray-500 mb-6 leading-relaxed flex-grow">{reward.desc}</p>
                    
                    <div className="pt-5 border-t border-gray-100 mt-auto flex items-center justify-between">
                      <div className="font-extrabold text-gold text-xl">{reward.cost} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pts</span></div>
                      <button 
                        onClick={() => openRedeemModal(reward)}
                        disabled={!canAfford || isLoadingData}
                        className="bg-navy hover:bg-[#122643] text-white px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-30 disabled:hover:bg-navy transition-all shadow-md"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'my-vouchers' && (
            <motion.div key="vouchers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4 max-w-3xl">
              {isLoadingData ? (
                 <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" /></div>
              ) : myVouchers.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Ticket className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-2">No Active Vouchers</h3>
                  <p className="text-gray-500 text-sm">Head over to the Reward Catalog to exchange your points for exclusive discounts.</p>
                </div>
              ) : (
                myVouchers.map(v => (
                  <div key={v.id} className="bg-white rounded-2xl p-6 border-l-4 border-l-gold shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center shrink-0 border border-green-100">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-navy text-lg mb-0.5">{v.rewardName}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> Activated</span>
                          <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] tracking-widest ${v.status === 'USED' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                            {v.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#fdfbf7] px-6 py-3 rounded-xl text-center md:text-right border border-gold/20 border-dashed shrink-0">
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-1">Voucher Code</p>
                      <p className="font-mono font-extrabold text-navy text-lg tracking-widest">{v.id.split('-').pop()?.toUpperCase()}</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* MODAL REDEEM DENGAN ANIMASI YANG DIPERBAIKI */}
      <Modal isOpen={!!selectedReward} onClose={() => { setSelectedReward(null); setModalState('confirm'); }} title="Reward Exchange">
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            
            {modalState === 'confirm' && (
              <motion.div 
                key="confirm" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }} 
                className="space-y-6"
              >
                <div className="bg-[#fdfaf5] p-6 rounded-2xl border border-gold/20 text-center">
                  <Gift className="w-12 h-12 text-gold mx-auto mb-3" />
                  <h3 className="text-xl font-extrabold text-navy mb-2">{selectedReward?.name}</h3>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">{selectedReward?.desc}</p>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cost To Deduct</span>
                    <span className="text-xl font-extrabold text-red-500">-{selectedReward?.cost} Pts</span>
                  </div>
                </div>
                <Button onClick={handleRedeem} isLoading={isRedeeming} className="w-full bg-navy hover:bg-[#122643] text-white py-4 rounded-xl font-bold shadow-xl">
                  Confirm & Exchange Points
                </Button>
              </motion.div>
            )}

            {modalState === 'success' && (
              <motion.div 
                key="success" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="text-center py-6 space-y-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner border border-green-200">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-navy mb-2">Voucher Secured!</h3>
                  <p className="text-sm text-gray-500 leading-relaxed px-4">The discount code has been added to your inventory. You can use it securely on your next checkout.</p>
                </div>
                <Button onClick={() => { setSelectedReward(null); setModalState('confirm'); setActiveTab('my-vouchers'); }} variant="outline" className="w-full py-4 rounded-xl font-bold">
                  View My Vouchers
                </Button>
              </motion.div>
            )}

            {modalState === 'error' && (
              <motion.div 
                key="error" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="text-center py-6 space-y-6"
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-navy mb-2">Transaction Failed</h3>
                  <p className="text-sm text-gray-500">{errorMessage}</p>
                </div>
                <Button onClick={() => setModalState('confirm')} variant="outline" className="w-full py-4 rounded-xl font-bold">
                  Try Again
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </Modal>

    </div>
  );
}