# BillSplit AI Test Report

## 1. Group to Assign Flow
**Scenario:** Add a person and proceed to the next step.
**Expected:** Application skips JSON input and proceeds directly to "Assign Items".
**Status:** ✅ Passed

## 2. Item Management
**Scenario:** Add a new item.
**Expected:** A blank item is created and immediately set to edit mode. User can type name and price, and click tick to save.
**Status:** ✅ Passed

**Scenario:** Edit an existing item.
**Expected:** Clicking pencil icon enters edit mode. Tick confirms changes.
**Status:** ✅ Passed

**Scenario:** Delete an existing item.
**Expected:** Clicking trash icon removes the item completely from the bill.
**Status:** ✅ Passed

## 3. Tax Management
**Scenario:** Add a tax.
**Expected:** Blank tax item is created in edit mode.
**Status:** ✅ Passed

**Scenario:** Add a second tax.
**Expected:** The "Add Tax" button disappears once one tax is added, limiting tax to only one entry.
**Status:** ✅ Passed

**Scenario:** Edit and Delete Tax.
**Expected:** Pencil and trash icons function the same as items, updating the amount or removing the tax.
**Status:** ✅ Passed

## 4. AI Scanner Overlay
**Scenario:** Click "Use AI to scan bill".
**Expected:** Modal overlay opens with instructions, copy prompt button, and text area.
**Status:** ✅ Passed

**Scenario:** Valid key-value input with replace mode.
**Expected:** The existing items are cleared, and new items/taxes from the parsed text are added to the list.
**Status:** ✅ Passed

**Scenario:** Valid key-value input with merge mode.
**Expected:** The existing items are preserved, and new items are appended. Existing tax amount is updated.
**Status:** ✅ Passed

## 5. Calculations and Assignments
**Scenario:** Assign an item to people and check "View Final Split".
**Expected:** The assigned items' prices are split equally among assigned users, and tax split methods (Equal/Proportional) are correctly applied to the final totals.
**Status:** ✅ Passed
