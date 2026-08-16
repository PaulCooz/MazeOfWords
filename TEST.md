# Manual test checklist

Do a **phone** pass and a **desktop** pass (browser). For ads, sound-on-hide, and language from Yandex, use a **draft** build on Yandex Games, not the Creator editor.

[Open with debug-panel](https://yandex.ru/games/app/565564?debug-mode=16&draft=true)

---

## 1. First launch

| #   | Check                             | Expected                                                                                          | Pass |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------- | ---- |
| 1.1 | Open the game and wait            | Grid and buttons appear. No black screen, spinner, or error overlay once play starts.             | ☐    |
| 1.2 | Header                            | Level number is **1**. Coin count is `startCoins` (new save).                                     | ☐    |
| 1.3 | Language (Yandex draft, new save) | Interface is **Russian** if the portal language is ru / be / kk / uk / uz, otherwise **English**. | ☐    |
| 1.4 | Music                             | Background music starts after the game is playable. No music during the Yandex startup ad.        | ☐    |

## 2. Finding words

| #   | Check                                                                 | Expected                                                                                                  | Pass |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| 2.1 | Drag along adjacent letters, then release                             | The word appears above the grid while you drag.                                                           | ☐    |
| 2.2 | Trace the **main** word (follow the finger hint on level 1 if needed) | Cells turn green. `+correctCoins` fly to the header. **Next** appears. Grid no longer accepts a new word. | ☐    |
| 2.3 | On a later level, enter a **wrong** path                              | Cells flash red and shake. Path clears. Coins unchanged.                                                  | ☐    |
| 2.4 | Enter a real extra word of **4+** letters that is not the main word   | Cells turn yellow. `+bonusCoins` the **first** time only. Same word again: no extra coin.                 | ☐    |
| 2.5 | Backtrack one cell while still holding                                | Last letter drops off the word.                                                                           | ☐    |


## 3. Hint, coins, rewarded ad

| #   | Check                                               | Expected                                                                                                                   | Pass |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---- |
| 3.1 | Tap **+letter** with enough coins                   | Coins fly from the header to a cell (`-hintCost`). Letter opens with an arrow.                                             | ☐    |
| 3.2 | Open **every** letter with hints                    | Level completes the same way as finding the main word. **Next** appears.                                                   | ☐    |
| 3.3 | Spend down to fewer than `hintCost` coins, tap hint | Toast about no coins / advertising. Finger points at the footer ad button. No letter opens.                                | ☐    |
| 3.4 | Tap the footer ad button                            | Rewarded video plays. After a successful watch, `+rewardedCoins` fly in. You can still play if the ad is skipped or fails. | ☐    |
| 3.5 | Sound during any fullscreen / rewarded ad           | Game music and SFX are silent. They return at the **same** volume as in settings after the ad.                             | ☐    |

## 4. Next level and interstitial

| #   | Check                                                             | Expected                                                    | Pass |
| --- | ----------------------------------------------------------------- | ----------------------------------------------------------- | ---- |
| 4.1 | Tap **Next**                                                      | Next level loads. Level number goes up. Grid is a new word. | ☐    |
| 4.2 | After **60**s in the session, complete a level and tap Next again | A fullscreen ad shows.                                      | ☐    |
| 4.3 | Tap **Definition** to open wiki                                   | A word page opens for current language.                     | ☐    |

## 5. Settings

| #   | Check                        | Expected                                                                                                          | Pass |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---- |
| 5.1 | Open settings (gear)         | Popup. Grid is not playable underneath.                                                                           | ☐    |
| 5.2 | Drag **Sound** and **Music** | SFX and music volumes change. Close and reopen: sliders stay.                                                     | ☐    |
| 5.3 | Switch language              | UI and dictionary switch (en ↔ ru). An unfinished level in the **other** language is restored if you switch back. | ☐    |


## 6. Tutorial (use a new save)

| #   | Check                                     | Expected                                                                               | Pass |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------- | ---- |
| 6.1 | Level **1**                               | Toast about swiping letters. A finger traces the word. Tap/swipe dismisses the finger. | ☐    |
| 6.2 | Level **2**                               | Finger traces again.                                                                   | ☐    |
| 6.3 | Level **5**                               | Toast about bonus words (4+ letters).                                                  | ☐    |
| 6.4 | Levels **1–5**, enter several wrong words | Finger traces the main word again after a few mistakes.                                | ☐    |

## 7. Save and layout

| #   | Check                                                  | Expected                                                                 | Pass |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------ | ---- |
| 7.1 | Open a hint, reload the page                           | Same level, same opened letters, same coins.                             | ☐    |
| 7.2 | Resize the window / rotate then return to **portrait** | Grid and buttons stay on screen, not stretched oddly. No page scrollbar. | ☐    |
| 7.3 | Long-press the grid                                    | No text selection, no browser context menu.                              | ☐    |
| 7.4 | Switch to another tab, then back (Yandex draft)        | Sound stops while away. Sound returns when you come back.                | ☐    |

## 8. Yandex SDK

| #   | Check                                                         | Expected                                           | Pass |
| --- | ------------------------------------------------------------- | -------------------------------------------------- | ---- |
| 8.1 | With debug-panel check `loading ready`, `gameplay start/stop` | Should be green circle and green/red gamepad icon. | ☐    |
| 8.2 | Change the hint cost                                          | After reload the new cost will be.                 | ☐    |
| 8.3 | Open new incognito window and sing in to your account         | The last level is open after pulling player data.  | ☐    |
| 8.4 | Check leaderboard sending by completing a level               | The score have changed.                            | ☐    |
