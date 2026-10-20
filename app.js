/* ============================================================================
   app.js — The Natural Plate meal planner (Alpine.js components)
   ============================================================================ */

document.addEventListener('alpine:init', () => {
  Alpine.data('naturalPlate', () => ({
    // ---- Global state ----
    currentView: 'browse',
    recipes: [],
    selectedRecipe: null,

    // ---- Filters ----
    search: '',
    filterSeason: [],
    filterMeal: [],
    filterDietary: [],
    filterTags: [],
    filterDifficulty: '',

    // ---- Meal plan ----
    plans: [],
    currentPlanName: '',
    currentPlanData: null,
    planDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    mealSlots: ['breakfast','lunch','snack','dinner'],

    // ---- Grocery list ----
    groceryChecks: {},

    // =====================================================================
    // Init
    // =====================================================================
    init() {
      const vm = this;
      fetch('./recipes.json')
        .then(r => { if (!r.ok) throw new Error('Failed to load recipes'); return r.json(); })
        .then(data => { vm.recipes = data.recipes || []; })
        .catch(err => { console.error('Error loading recipes:', err); vm.recipes = []; });
      this.loadPlansFromStorage();
    },

    // =====================================================================
    // Computed: filteredRecipes
    // =====================================================================
    get filteredRecipes() {
      return this.recipes.filter(recipe => {
        if (tthis.search.trim()) {
          const q = tthis.search.toLowerCase().trim();
          const inTitle = recipe.title.toLowerCase().includes(q);
          const inDesc = (recipe.description || '').toLowerCase().includes(q);
          const inTags = (recipe.tags || []).some(t => t.toLowerCase().includes(q));
          if (!inTitle && !inDesc && !inTags) return false;
        }
        if (this.filterSeason.length > 0) {
          if (!this.filterSeason.some(s => (recipe.season || []).includes(s))) return false;
        }
        if (this.filterMeal.length > 0) {
          if (!this.filterMeal.some(m => (recipe.meal || []).includes(m))) return false;
        }
        if (this.filterDietary.length > 0) {
          if (!this.filterDietary.some(d => (recipe.dietary || []).includes(d))) return false;
        }
        if (this.filterTags.length > 0) {
          if (!this.filterTags.some(t => (recipe.tags || []).includes(t))) return false;
        }
        if (this.filterDifficulty) {
          if (recipe.difficulty !== this.filterDifficulty) return false;
        }
        return true;
      });
    },

    // =====================================================================
    // Filter helpers
    // =====================================================================
    toggleFilter(type, value) {
      const arr = this[type];
      if (!arr) return;
      const idx = arr.indexOf(value);
      if (idx === -1) arr.push(value);
      else arr.splice(idx, 1);
    },

    isFilterActive(type, value) {
      const arr = this[type];
      if (!arr) return false;
      return arr.indexOf(value) !== -1;
    },

    clearFilters() {
      tthis.search = '';
      this.filterSeason = [];
      this.filterMeal = [];
      this.filterDietary = [];
      this.filterTags = [];
      this.filterDifficulty = '';
    },

    get hasActiveFilters() {
      return !!(tthis.search.trim()
        || this.filterSeason.length
        || this.filterMeal.length
        || this.filterDietary.length
        || this.filterTags.length
        || this.filterDifficulty);
    },


    // =====================================================================
    // Recipe detail
    // =====================================================================
    showRecipe(recipe) {
      this.selectedRecipe = recipe;
    },

    closeRecipe() {
      this.selectedRecipe = null;
    },

    getRecipeById(id) {
      return this.recipes.find(r => r.id === id);
    },

    // =====================================================================
    // Meal plan
    // =====================================================================
    loadPlansFromStorage() {
      try {
        const stored = localStorage.getItem('natural-plans');
        this.plans = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.warn('Could not load plans from localStorage', e);
        this.plans = [];
      }
    },

    savePlansToStorage() {
      try {
        localStorage.setItem('natural-plans', JSON.stringify(this.plans));
      } catch (e) {
        console.warn('Could not save plans to localStorage', e);
      }
    },

    addRecipeToMeal(dayIndex, slot, recipeId) {
      if (!this.currentPlanData) {
        if (!this.currentPlanName.trim()) this.currentPlanName = 'My Plan';
        this.currentPlanData = this.createEmptyPlan(this.currentPlanName);
      }
      if (!this.currentPlanData.days[dayIndex]) this.currentPlanData.days[dayIndex] = {};
      this.currentPlanData.days[dayIndex][slot] = recipeId;
    },

    getMealRecipe(dayIndex, slot) {
      if (!this.currentPlanData) return null;
      const day = this.currentPlanData.days[dayIndex];
      if (!day) return null;
      const recipeId = day[slot];
      if (!recipeId) return null;
      return this.getRecipeById(recipeId);
    },

    createEmptyPlan(name) {
      return { name: name || 'Unnamed Plan', days: this.planDays.map(() => ({})) };
    },

    savePlan(name) {
      const planName = name || this.currentPlanName || 'My Plan';
      if (!this.currentPlanData) this.currentPlanData = this.createEmptyPlan(planName);
      this.currentPlanData.name = planName;
      this.currentPlanName = planName;
      const idx = this.plans.findIndex(p => p.name === planName);
      const copy = JSON.parse(JSON.stringify(this.currentPlanData));
      if (idx !== -1) this.plans[idx] = copy;
      else this.plans.push(copy);
      this.savePlansToStorage();
    },

    deletePlan(name) {
      this.plans = this.plans.filter(p => p.name !== name);
      this.savePlansToStorage();
      if (this.currentPlanName === name) {
        this.currentPlanData = null;
        this.currentPlanName = '';
      }
    },

    loadPlan(name) {
      const plan = this.plans.find(p => p.name === name);
      if (plan) {
        this.currentPlanData = JSON.parse(JSON.stringify(plan));
        this.currentPlanName = plan.name;
      }
    },

    newPlan() {
      this.currentPlanData = null;
      this.currentPlanName = '';
    },


    // =====================================================================
    // Grocery list — amount consolidation
    // =====================================================================

    // Parse a fraction string like "1/2", "1 1/2", "2.5" into a number
    _parseAmount(str) {
      str = str.trim();
      const parts = str.split(/\s+/);
      let total = 0;
      parts.forEach(p => {
        const frac = p.match(/^(\d+)\/(\d+)$/);
        if (frac) { total += parseInt(frac[1]) / parseInt(frac[2]); }
        else { total += parseFloat(p) || 0; }
      });
      return total;
    },

    // Format a number back into a friendly fraction string
    _formatAmount(v) {
      if (Number.isInteger(v)) return v.toString();
      const whole = Math.floor(v);
      const frac = Math.round((v - whole) * 1000) / 1000;
      if (frac === 0) return whole.toString();
      const map = { 0125: '1/8', 0.25: '1/4', 0.333: '1/3', 0.375: '3/8', 0.5: '1/2', 0.625: '5/8', 0.666: '2/3', 0.75: '3/4', 0.875: '7/8' };
      let best = null, bestDelta = 1;
      Object.entries(map).forEach(([dec, lab]) => {
        const d = Math.abs(frac - parseFloat(dec));
        if (d < bestDelta) { bestDelta = d; best = lab; }
      });
      if (bestDelta < 0.05 && best) return whole > 0 ? whole + ' ' + best : best;
      return v.toFixed(2);
    },

    // Consolidate multiple amount strings for the same ingredient
    _consolidateAmount(amounts) {
      if (!amounts || amounts.length === 0) return '';
      if (amounts.length === 1) return amounts[0];

      const numeric = amounts.filter(a => a && a !== 'to taste' && a !== 'pinch');
      if (numeric.length === 0) return amounts[0] || '';

      // Parse each into {value, unit}
      const parsed = numeric.map(a => {
        const m = a.match(/^([\d\s\/\.]+)\s+(.+)$/);
        return m ? { value: this._parseAmount(m[1]), unit: m[2].trim() } : { value: null, unit: null };
      });

      // Sum by unit
      const byUnit = {};
      parsed.forEach(p => {
        if (p.value !== null && p.unit) byUnit[p.unit] = (byUnit[p.unit] || 0) + p.value;
      });

      const keys = Object.keys(byUnit);
      if (keys.length === 0) return [...new Set(numeric)].join(' + ');

      return keys.map(u => this._formatAmount(byUnit[u]) + ' ' + u).join(' + ');
    },


    get groceryItems() {
      if (!this.currentPlanData) return [];
      var items = {};
      var vm = this;

      this.currentPlanData.days.forEach(function(day, dayIdx) {
        vm.mealSlots.forEach(function(slot) {
          var recipeId = day[slot];
          if (!recipeId) return;
          var recipe = vm.getRecipeById(recipeId);
          if (!recipe || !recipe.ingredients) return;

          recipe.ingredients.forEach(function(ing) {
            var key = ing.name.toLowerCase();
            if (!items[key]) {
              items[key] = { name: ing.name, amounts: [], type: ing.type || 'pantry', checked: vm.groceryChecks[key] || false };
            }
            if (ing.amount && ing.amount !== 'to taste') {
              items[key].amounts.push(ing.amount);
            } else if (items[key].amounts.indexOf('to taste') === -1) {
              items[key].amounts.push('to taste');
            }
          });
        });
      });

      var result = Object.keys(items).map(function(key) {
        var item = items[key];
        return { name: item.name, amount: vm._consolidateAmount(item.amounts), type: item.type, checked: item.checked };
      });

      var typeOrder = ['produce', 'grains', 'legumes', 'pantry', 'condiments', 'dairy', 'other'];
      result.sort(function(a, b) {
        var aIdx = typeOrder.indexOf(a.type);
        var bIdx = typeOrder.indexOf(b.type);
        if (aIdx === -1) aIdx = typeOrder.length - 1;
        if (bIdx === -1) bIdx = typeOrder.length - 1;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.name.localeCompare(b.name);
      });

      return result;
    },

    get groceryGroups() {
      var groups = {};
      this.groceryItems.forEach(function(item) {
        var type = item.type || 'other';
        if (!groups[type]) groups[type] = [];
        groups[type].push(item);
      });
      return groups;
    },

    toggleItem(index) {
      var items = this.groceryItems;
      if (items[index]) {
        items[index].checked = !items[index].checked;
        var key = items[index].name.toLowerCase();
        this.groceryChecks[key] = items[index].checked;
      }
    },

    clearChecks() {
      var vm = this;
      this.groceryItems.forEach(function(item) {
        item.checked = false;
        var key = item.name.toLowerCase();
        vm.groceryChecks[key] = false;
      });
    },

    printGroceryList() {
      window.print();
    },

    copyGroceryList() {
      if (!this.currentPlanData || this.groceryItems.length === 0) return;

      var text = "Grocery List: " + this.currentPlanData.name + "\n";
      text += "==============================\n";

      var vm = this;
      Object.keys(this.groceryGroups).forEach(function(type) {
        text += "\n" + type.charAt(0).toUpperCase() + type.slice(1) + ":\n";
        vm.groceryGroups[type].forEach(function(item) {
          var check = item.checked ? "[x]" : "[ ]";
          var amt = item.amount ? " (" + item.amount + ")" : "";
          text += "  " + check + " " + item.name + amt + "\n";
        });
      });

      text += "\n---\nGenerated by The Natural Plate";

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          alert("Grocery list copied! Paste it into Google Keep, Notes, etc.");
        });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        alert("Grocery list copied to clipboard!");
      }
    },

    getAllValues(key) {
      var values = new Set();
      this.recipes.forEach(function(r) {
        var val = r[key];
        if (Array.isArray(val)) {
          val.forEach(function(v) { values.add(v); });
        }
      });
      return [...values].sort();
    }
  }));
});
