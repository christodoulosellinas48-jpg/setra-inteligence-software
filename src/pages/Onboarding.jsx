import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coffee, UtensilsCrossed, Croissant, Truck, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BusinessTypeCard from '@/components/onboarding/BusinessTypeCard';

const BUSINESS_TYPES = [
  {
    type: 'cafe',
    icon: Coffee,
    title: 'Café',
    description: 'Coffee shops, tea houses, and casual drink-focused establishments'
  },
  {
    type: 'restaurant',
    icon: UtensilsCrossed,
    title: 'Restaurant',
    description: 'Full-service dining, bistros, and meal-focused venues'
  },
  {
    type: 'bakery',
    icon: Croissant,
    title: 'Bakery',
    description: 'Bakeries, patisseries, and baked goods specialists'
  },
  {
    type: 'food_truck',
    icon: Truck,
    title: 'Food Truck',
    description: 'Mobile food service and street food operations'
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    
    await base44.entities.BusinessProfile.create({
      business_name: businessName,
      business_type: selectedType,
      setup_complete: true,
      monthly_revenue: 0,
      rent_fixed_costs: 0,
      staff_costs: 0,
      purchases_food_bev: 0,
      utilities: 0,
      other_operating: 0
    });
    
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-4xl w-full"
      >
        {/* Progress indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {s}
                </div>
                {s < 2 && (
                  <div className={`w-16 h-1 rounded-full ${
                    step > s ? 'bg-emerald-500' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-white mb-4">
                Welcome to Ellinas THE SETTING (beta test)
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Select your business type to receive tailored benchmarks and insights optimized for your industry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {BUSINESS_TYPES.map((bt) => (
                <BusinessTypeCard
                  key={bt.type}
                  {...bt}
                  selected={selectedType === bt.type}
                  onClick={() => setSelectedType(bt.type)}
                />
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedType}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl disabled:opacity-50"
              >
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-white mb-4">
                Name Your Business
              </h1>
              <p className="text-slate-400 text-lg">
                This helps personalize your dashboard and reports.
              </p>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8">
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., The Corner Café"
                className="bg-slate-800/50 border-slate-600 text-white text-lg h-14 text-center"
              />
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 px-6 py-6"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!businessName.trim() || loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Launch Dashboard'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}