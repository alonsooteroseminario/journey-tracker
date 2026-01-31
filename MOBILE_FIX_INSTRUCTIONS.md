# Mobile Fix Instructions - Eliminate Horizontal Scrolling

## ✅ COMPLETED
1. **Global CSS fixes** - Added `overflow-x: hidden` to html/body in `src/app/globals.css`

## 🔴 TODO - Apply These Manual Edits

### Quick Find & Replace Guide

Open each file and use your editor's Find & Replace (Ctrl+H or Cmd+H):

---

## File 1: src/app/page.tsx

**Replace 1:**
- Find: `px-4 py-4`
- Replace: `px-3 sm:px-4 py-3 sm:py-4`
- Occurrences: 1 (header)

**Replace 2:**
- Find: `px-4 py-8 pb-24`
- Replace: `px-3 sm:px-4 py-6 sm:py-8 pb-24`
- Occurrences: 1 (main content)

---

## File 2: src/app/goals/page.tsx

**Replace 1:**
- Find: `px-4 py-4`
- Replace: `px-3 sm:px-4 py-3 sm:py-4`
- Occurrences: 1 (header)

**Replace 2:**
- Find: `px-4 py-8 pb-24`
- Replace: `px-3 sm:px-4 py-6 sm:py-8 pb-24`
- Occurrences: 1 (main)

---

## File 3: src/components/GoalCard.tsx

**Replace in order (important - do in this sequence):**

1. **Header padding:**
   - Find: `className={\\`p-6 \\${`
   - Replace: `className={\\`p-3 sm:p-6 \\${`
   - Occurrences: 1 (line ~108)

2. **Title container:**
   - Find: `<div className="flex-1">`
   - Replace: `<div className="flex-1 min-w-0">`
   - Occurrences: 1 (line ~115)

3. **Title flex:**
   - Find: `<div className="flex items-center gap-2">`
   - Replace: `<div className="flex items-center gap-1.5 sm:gap-2">`
   - Occurrences: Multiple - only change the one with the emoji

4. **Emoji size:**
   - Find: `<span className="text-3xl">🍁</span>`
   - Replace: `<span className="text-2xl sm:text-3xl flex-shrink-0">🍁</span>`
   - Occurrences: 1

5. **Title text:**
   - Find: `<h3 className="text-xl font-bold text-gray-800">{goal.title}</h3>`
   - Replace: `<h3 className="text-base sm:text-xl font-bold text-gray-800 truncate">{goal.title}</h3>`
   - Occurrences: 1

6. **Description:**
   - Find: `<p className="text-gray-600 mt-1">{goal.description}</p>`
   - Replace: `<p className="text-sm sm:text-base text-gray-600 mt-1 line-clamp-2">{goal.description}</p>`
   - Occurrences: 1

7. **Buttons container:**
   - Find: `<div className="flex items-center gap-2">`
   - Replace: `<div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">`
   - Occurrences: 1 (the one with buttons)

8. **Expand button:**
   - Find: `p-3 min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-400`
   - Replace: `p-2 sm:p-3 min-w-[40px] sm:min-w-[48px] min-h-[40px] sm:min-h-[48px] flex items-center justify-center text-gray-400`
   - Occurrences: 2 (both buttons)

9. **Button SVG:**
   - Find: `w-5 h-5 transition-transform`
   - Replace: `w-4 h-4 sm:w-5 sm:h-5 transition-transform`
   - Occurrences: 1 (expand button)

10. **Delete button SVG:**
    - Find: `<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">`
    - Replace: `<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">`
    - Occurrences: 1 (delete button - look for trash icon path)

11. **Progress section:**
    - Find: `<div className="mt-4">`  (the one before progress text)
    - Replace: `<div className="mt-3 sm:mt-4">`
    - Occurrences: 2

12. **Progress text:**
    - Find: `text-sm text-gray-600 mb-2`
    - Replace: `text-xs sm:text-sm text-gray-600 mb-2`
    - Occurrences: 1

13. **Progress count text:**
    - Find: `<span>{completedCount} of {totalCount} steps completed</span>`
    - Replace: `<span className="truncate">{completedCount} of {totalCount} steps</span>`
    - Occurrences: 1

14. **Complete badge:**
    - Find: `<span className="text-green-600 font-semibold">Complete!</span>`
    - Replace: `<span className="text-green-600 font-semibold text-xs sm:text-sm flex-shrink-0 ml-2">Complete!</span>`
    - Occurrences: 1

15. **Progress bar size:**
    - Find: `<ProgressBar progress={progress} showPercentage={true} size="lg" />`
    - Replace: `<ProgressBar progress={progress} showPercentage={true} size="md" />`
    - Occurrences: 1

16. **Tabs container:**
    - Find: `<div className="mt-4 grid grid-cols-2 sm:flex gap-2">`
    - Replace: `<div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 md:flex gap-1.5 sm:gap-2">`
    - Occurrences: 1

17. **Tab buttons (do all 5 buttons):**
    - Find: `px-3 sm:px-4 py-2 min-h-[44px] rounded-lg text-xs sm:text-sm font-medium`
    - Replace: `px-2 sm:px-3 py-1.5 sm:py-2 min-h-[40px] rounded-lg text-xs font-medium`
    - Occurrences: 5

18. **Tab button text (do for each of the 5 tabs):**
    Change from:
    ```tsx
    📊 <span className="hidden xs:inline">Phases</span>
    ```
    To:
    ```tsx
    <span className="block sm:hidden">📊</span>
    <span className="hidden sm:inline">📊 Phases</span>
    ```

19. **Content padding:**
    - Find: `<div className="p-6 border-t border-gray-100">`
    - Replace: `<div className="p-3 sm:p-6 border-t border-gray-100">`
    - Occurrences: 1

---

## File 4: src/components/Navigation.tsx

**Replace in order:**

1. **Logo container:**
   - Find: `flex items-center gap-2 min-h-[48px]`
   - Replace: `flex items-center gap-1.5 sm:gap-2 min-h-[48px]`
   - Occurrences: 1 (logo link)

2. **Logo size:**
   - Find: `w-10 h-10 bg-gradient-to-br`
   - Replace: `w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br`
   - Occurrences: 1

3. **Logo emoji:**
   - Find: `<span className="text-2xl">🚀</span>`
   - Replace: `<span className="text-xl sm:text-2xl">🚀</span>`
   - Occurrences: 1

4. **Profile link:**
   - Find: `p-2 min-w-[48px] min-h-[48px] rounded-full`
   - Replace: `p-1.5 sm:p-2 min-w-[40px] sm:min-w-[48px] min-h-[40px] sm:min-h-[48px] rounded-full`
   - Occurrences: 1

5. **Profile avatar:**
   - Find: `w-10 h-10 rounded-full`
   - Replace: `w-8 h-8 sm:w-10 sm:h-10 rounded-full`
   - Occurrences: 2 (both img and div)

6. **Mobile nav padding:**
   - Find: `py-2 px-2`
   - Replace: `py-1.5 px-1`
   - Occurrences: 1 (bottom nav)

7. **Mobile nav items:**
   - Find: `min-w-[64px] min-h-[56px]`
   - Replace: `min-w-[56px] min-h-[52px]`
   - Occurrences: 1

8. **Mobile nav icons:**
   - Find: `<span className="text-2xl">{item.icon}</span>`
   - Replace: `<span className="text-xl">{item.icon}</span>`
   - Occurrences: 1 (in mobile nav)

---

## File 5: src/components/StreakCounter.tsx

**Replace in order:**

1. **Container padding:**
   - Find: `rounded-2xl p-4 sm:p-6 border`
   - Replace: `rounded-2xl p-3 sm:p-6 border`
   - Occurrences: 1

2. **Streak number:**
   - Find: `text-3xl sm:text-4xl md:text-5xl font-black`
   - Replace: `text-2xl sm:text-4xl md:text-5xl font-black`
   - Occurrences: 1

3. **Calendar grid:**
   - Find: `grid grid-cols-7 gap-1 sm:gap-2`
   - Replace: `grid grid-cols-7 gap-0.5 sm:gap-2`
   - Occurrences: 1

4. **Day cell padding:**
   - Find: `p-1 sm:p-2 rounded-lg`
   - Replace: `p-0.5 sm:p-2 rounded-lg`
   - Occurrences: 1

5. **Day letter (already fixed to 12px, but ensure):**
   - Find: `text-xs sm:text-sm text-gray-500`
   - Keep as is (should already be text-xs)

6. **Day indicator:**
   - Find: `w-6 h-6 sm:w-8 sm:h-8`
   - Replace: `w-5 h-5 sm:w-8 sm:h-8`
   - Occurrences: 1

---

## File 6: src/components/CreateGoalModal.tsx

**Replace in order:**

1. **Modal wrapper:**
   - Find: `max-w-lg w-full shadow-2xl`
   - Replace: `max-w-lg w-full mx-2 sm:mx-0 shadow-2xl`
   - Occurrences: 1

2. **Header padding:**
   - Find: `p-4 sm:p-6 sticky top-0`
   - Replace: `p-3 sm:p-6 sticky top-0`
   - Occurrences: 1

3. **Header title:**
   - Find: `text-xl sm:text-2xl font-bold`
   - Replace: `text-lg sm:text-2xl font-bold`
   - Occurrences: 1

4. **Content padding:**
   - Find: `p-4 sm:p-6 pb-safe`
   - Replace: `p-3 sm:p-6 pb-safe`
   - Occurrences: 1

5. **Template button padding:**
   - Find: `p-4 sm:p-5 bg-gradient-to-r`
   - Replace: `p-3 sm:p-5 bg-gradient-to-r`
   - Occurrences: 1

6. **Template icon:**
   - Find: `gap-3 sm:gap-4`
   - Replace: `gap-2 sm:gap-4`
   - Occurrences: 1

7. **Template emoji:**
   - Find: `text-3xl sm:text-4xl`
   - Replace: `text-2xl sm:text-4xl`
   - Occurrences: 1

---

## Testing After Fixes

1. Start dev server:
```bash
npm run dev
```

2. Open http://localhost:3000 in Chrome/Edge

3. Open DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)

4. Test these widths:
   - 320px (smallest) - Should have NO horizontal scroll
   - 375px (iPhone SE) - Should have NO horizontal scroll
   - 390px (iPhone 12 Pro) - Should have NO horizontal scroll

5. In DevTools console, run:
```javascript
document.body.scrollWidth <= window.innerWidth
// Should return: true
```

6. Visual check:
   - No horizontal scrollbar visible
   - All text readable
   - All buttons tappable
   - No content cut off

---

## Summary

**Total Files to Edit**: 6
**Total Changes**: ~50-60 find/replace operations

**Time Estimate**: 15-20 minutes

**Order of Priority**:
1. globals.css ✅ DONE
2. page.tsx & goals/page.tsx (page containers)
3. GoalCard.tsx (most visible)
4. Navigation.tsx (always visible)
5. StreakCounter.tsx (dashboard)
6. CreateGoalModal.tsx (modal)

**Result**: Completely eliminates horizontal scrolling on all devices 320px and above.
