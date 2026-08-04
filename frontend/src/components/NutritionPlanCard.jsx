import { Apple, Droplets, Beef, Ban, Pill } from "lucide-react";

export default function NutritionPlanCard({ nutritionPlan }) {
  const hasPlan =
    nutritionPlan &&
    (nutritionPlan.dietType ||
      nutritionPlan.calorieGoal ||
      nutritionPlan.waterGoal ||
      nutritionPlan.proteinGoal ||
      nutritionPlan.restrictions?.length ||
      nutritionPlan.supplements?.length);

  return (
    <div className="rounded-xl border border-border bg-paper-card p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Apple size={16} strokeWidth={2} />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">
          Nutrition Plan
        </h3>
      </div>

      {!hasPlan ? (
        <p className="text-sm text-ink-soft">No nutrition plan set yet.</p>
      ) : (
        <div className="space-y-5">
          {(nutritionPlan.dietType ||
            nutritionPlan.calorieGoal ||
            nutritionPlan.waterGoal ||
            nutritionPlan.proteinGoal) && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {nutritionPlan.dietType && (
                <Stat label="Diet Type" value={nutritionPlan.dietType} />
              )}
              {nutritionPlan.calorieGoal && (
                <Stat
                  icon={Apple}
                  label="Calories"
                  value={`${nutritionPlan.calorieGoal} kcal`}
                />
              )}
              {nutritionPlan.waterGoal && (
                <Stat
                  icon={Droplets}
                  label="Water"
                  value={`${nutritionPlan.waterGoal} ml`}
                />
              )}
              {nutritionPlan.proteinGoal && (
                <Stat
                  icon={Beef}
                  label="Protein"
                  value={`${nutritionPlan.proteinGoal} g`}
                />
              )}
            </div>
          )}

          {nutritionPlan.restrictions?.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose">
                <Ban size={12} strokeWidth={2.5} />
                Restrictions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {nutritionPlan.restrictions.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-rose-soft px-2.5 py-1 text-xs font-medium text-rose"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {nutritionPlan.supplements?.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                <Pill size={12} strokeWidth={2.5} />
                Supplements
              </p>
              <div className="flex flex-wrap gap-1.5">
                {nutritionPlan.supplements.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
