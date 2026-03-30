import React, { useState } from 'react';
import { Soup, Trash2 } from 'lucide-react';
import { FoodEntry } from '../../types.ts';

interface NutritionTrackerProps {
  foodEntries: FoodEntry[];
  onAddFoodEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  onRemoveFoodEntry: (id: string) => void;
}

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({ foodEntries, onAddFoodEntry, onRemoveFoodEntry }) => {
  const [foodName, setFoodName] = useState('');
  const [foodCals, setFoodCals] = useState('');
  const [foodProtein, setFoodProtein] = useState('');
  const [foodFolate, setFoodFolate] = useState('');
  const [foodIron, setFoodIron] = useState('');
  const [foodCalcium, setFoodCalcium] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Soup className="w-5 h-5 text-rose-500" />
          Log Nutrition
        </h3>
        <p className="text-xs text-slate-500 mb-4 italic">
          Track your daily nutrition with Nestly.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Food Name"
            className="w-full p-3 rounded-xl border border-black/10"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Calories"
            className="w-full p-3 rounded-xl border border-black/10"
            value={foodCals}
            onChange={(e) => setFoodCals(e.target.value)}
          />
          <input
            type="number"
            placeholder="Protein (g)"
            className="w-full p-3 rounded-xl border border-black/10"
            value={foodProtein}
            onChange={(e) => setFoodProtein(e.target.value)}
          />
          <input
            type="number"
            placeholder="Folate (mcg)"
            className="w-full p-3 rounded-xl border border-black/10"
            value={foodFolate}
            onChange={(e) => setFoodFolate(e.target.value)}
          />
          <input
            type="number"
            placeholder="Iron (mg)"
            className="w-full p-3 rounded-xl border border-black/10"
            value={foodIron}
            onChange={(e) => setFoodIron(e.target.value)}
          />
          <input
            type="number"
            placeholder="Calcium (mg)"
            className="w-full p-3 rounded-xl border border-black/10"
            value={foodCalcium}
            onChange={(e) => setFoodCalcium(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            if (foodName) {
              const cals = parseFloat(foodCals) || 0;
              const protein = parseFloat(foodProtein) || 0;
              const folate = parseFloat(foodFolate) || 0;
              const iron = parseFloat(foodIron) || 0;
              const calcium = parseFloat(foodCalcium) || 0;
              
              if (cals >= 0 && cals < 10000 && protein >= 0 && protein < 1000 && folate >= 0 && folate < 10000 && iron >= 0 && iron < 1000 && calcium >= 0 && calcium < 10000) {
                onAddFoodEntry({
                  name: foodName,
                  calories: cals,
                  protein: protein,
                  folate: folate,
                  iron: iron,
                  calcium: calcium
                });
                setFoodName('');
                setFoodCals('');
                setFoodProtein('');
                setFoodFolate('');
                setFoodIron('');
                setFoodCalcium('');
                setError(null);
              } else {
                setError("Please enter valid nutrition values.");
              }
            }
          }}
          className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
        >
          Log Food
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
        <h3 className="text-lg font-semibold mb-4">Recent Food</h3>
        <div className="space-y-3">
          {foodEntries.slice(0, 5).map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div>
                <p className="font-medium">{entry.name}</p>
                <p className="text-xs text-stone-500">
                  {entry.calories} kcal • {entry.protein}g P • {entry.folate}mcg F
                </p>
              </div>
              <button 
                onClick={() => onRemoveFoodEntry(entry.id)}
                className="p-2 text-stone-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
