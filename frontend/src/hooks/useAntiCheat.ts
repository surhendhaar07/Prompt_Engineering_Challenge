import { useEffect, useState, useCallback, useRef } from 'react';
import * as challengeService from '../services/challengeService';
import { ActivityEventType } from '../types';

interface AntiCheatOptions {
  challengeId?: string;
  teamName?: string;
  teamNumber?: string;
  isActive: boolean;
  onWarning?: (message: string) => void;
}

export interface ViolationState {
  isOpen: boolean;
  count: number;
  reason: string;
  timestamp: string;
}

// Synthesized audio alert tone via Web Audio API (no external file needed)
const playViolationAlarm = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Autoplay restrictions may apply until first user gesture
  }
};

export function useAntiCheat({ challengeId, teamName, teamNumber, isActive, onWarning }: AntiCheatOptions) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [isPrivacyShieldActive, setIsPrivacyShieldActive] = useState<boolean>(false);
  const [tabSwitches, setTabSwitches] = useState<number>(0);
  const [fullscreenExits, setFullscreenExits] = useState<number>(0);
  const [copyAttempts, setCopyAttempts] = useState<number>(0);
  const [pasteAttempts, setPasteAttempts] = useState<number>(0);

  // Violation Modal State
  const [violationState, setViolationState] = useState<ViolationState>({
    isOpen: false,
    count: 0,
    reason: '',
    timestamp: '',
  });

  // Stable references
  const onWarningRef = useRef(onWarning);
  onWarningRef.current = onWarning;

  const challengeIdRef = useRef(challengeId);
  challengeIdRef.current = challengeId;

  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const tabSwitchesRef = useRef<number>(0);
  const isCurrentlyUnfocusedRef = useRef<boolean>(false);
  const isAltPressedRef = useRef<boolean>(false);
  const lastInPageClickRef = useRef<number>(0);
  const lastLoggedRef = useRef<{ [key: string]: number }>({});
  const lastViolationTimeRef = useRef<number>(0);

  const reportEvent = useCallback((type: ActivityEventType, details?: string) => {
    if (!isActiveRef.current) return;

    const now = Date.now();
    const last = lastLoggedRef.current[type] || 0;
    if (now - last < 400 && type !== 'START' && type !== 'SUBMIT_MANUAL') {
      return;
    }
    lastLoggedRef.current[type] = now;

    challengeService.logActivity(type, details, challengeIdRef.current);
  }, []);

  const triggerWarning = useCallback((message: string, isShield: boolean = false) => {
    if (onWarningRef.current) {
      onWarningRef.current(message);
    }
    if (isShield) {
      setIsPrivacyShieldActive(true);
      setTimeout(() => setIsPrivacyShieldActive(false), 2000);
    }
  }, []);

  // Request & Enforce Fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      setIsFullscreen(true);

      // Lock system keyboard shortcuts when fullscreen is entered (Chromium)
      if ('keyboard' in navigator && (navigator as any).keyboard?.lock) {
        try {
          await (navigator as any).keyboard.lock([
            'Escape',
            'Tab',
            'AltLeft',
            'AltRight',
            'MetaLeft',
            'MetaRight',
            'KeyW',
            'KeyN',
            'KeyT',
            'KeyR',
            'F1', 'F3', 'F5', 'F6', 'F7', 'F10', 'F11', 'F12'
          ]);
          console.log('[AntiCheat] Keyboard lock engaged.');
        } catch (lockErr) {
          console.warn('[AntiCheat] Keyboard lock not permitted:', lockErr);
        }
      }
    } catch (err) {
      console.warn('[Fullscreen] Request bypassed:', err);
      setIsFullscreen(true);
    }
  }, []);

  // Acknowledge Violation Modal
  const acknowledgeViolation = useCallback(() => {
    setViolationState((prev) => ({ ...prev, isOpen: false }));
    isCurrentlyUnfocusedRef.current = false;
    lastInPageClickRef.current = Date.now();
    // Re-lock fullscreen and keyboard
    requestFullscreen();
    // Refocus textarea editor
    const textarea = document.getElementById('prompt-editor');
    if (textarea) textarea.focus();
  }, [requestFullscreen]);

  useEffect(() => {
    if (!isActive) return;

    // Track user clicks and taps inside the page to prevent false positives when clicking UI elements
    const handleInPageInteraction = () => {
      lastInPageClickRef.current = Date.now();
    };

    // -------------------------------------------------------------
    // High-Sensitivity Focus State Tracker (Catches Alt+Tab, New Tabs, Background Tabs)
    // -------------------------------------------------------------
    const onFocusLost = (triggerReason: string) => {
      if (!isActiveRef.current) return;

      const now = Date.now();
      // Throttle violation modal triggers by 800ms to prevent duplicate dialogs in same switch
      if (now - lastViolationTimeRef.current < 800) return;
      lastViolationTimeRef.current = now;

      isCurrentlyUnfocusedRef.current = true;
      tabSwitchesRef.current += 1;
      const count = tabSwitchesRef.current;
      setTabSwitches(count);

      // Play audio alarm
      playViolationAlarm();

      // Open unmissable violation modal
      const timestamp = new Date().toLocaleTimeString();
      setViolationState({
        isOpen: true,
        count,
        reason: triggerReason,
        timestamp,
      });

      reportEvent('TAB_SWITCH', `Tab switch / Alt+Tab #${count} detected via ${triggerReason}.`);
      triggerWarning(
        `⚠️ PROCTORING ALERT: Tab switch / Alt+Tab #${count} detected! Leaving the workspace is strictly prohibited.`,
        true
      );
    };

    const onFocusGained = () => {
      if (!isActiveRef.current) return;
      if (!isCurrentlyUnfocusedRef.current) return;

      // Keep violation modal open until participant explicitly clicks "Acknowledge"
      reportEvent('WINDOW_FOCUS', 'Window focus restored by participant.');
    };

    // 1. Direct Browser Event Handlers
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        onFocusLost('document.hidden (tab switch / background tab)');
      } else if (document.visibilityState === 'visible') {
        onFocusGained();
      }
    };

    const handleWindowBlur = () => {
      // If the user just clicked an in-page UI element (e.g. dismissing an alert banner, clicking a button),
      // ignore transient element focus transfers
      if (Date.now() - lastInPageClickRef.current < 350) {
        return;
      }

      // If document is hidden, it's an immediate tab switch / minimize
      if (document.hidden || document.visibilityState === 'hidden') {
        onFocusLost('window.blur (tab switch / window minimize)');
        return;
      }

      // Verify after 70ms that focus truly left the browser window (e.g. Alt+Tab to external app)
      setTimeout(() => {
        if (!isActiveRef.current) return;
        if (!document.hasFocus() && Date.now() - lastInPageClickRef.current >= 350) {
          onFocusLost('window.blur (Alt+Tab / application switch)');
        }
      }, 70);
    };

    const handleWindowFocus = () => {
      onFocusGained();
    };

    const handlePageHide = () => {
      onFocusLost('pagehide (browser window navigation)');
    };

    // 2. High-Frequency Focus & State Poller (every 50ms)
    const focusPollerInterval = setInterval(() => {
      if (!isActiveRef.current) return;

      const isDocumentHidden = document.hidden || document.visibilityState === 'hidden';

      // 100% immediate trigger for tab switches or new tabs
      if (isDocumentHidden) {
        if (!isCurrentlyUnfocusedRef.current) {
          onFocusLost('document.hidden (tab switch / background tab)');
        }
        return;
      }

      // For document.hasFocus loss: ignore if participant was clicking inside page in the last 350ms
      const isDocumentFocused = document.hasFocus();
      if (!isDocumentFocused) {
        if (!isCurrentlyUnfocusedRef.current && Date.now() - lastInPageClickRef.current >= 350) {
          onFocusLost('focus loss / application switch');
        }
      }
    }, 50);

    // -------------------------------------------------------------
    // 3. Fullscreen Monitoring
    // -------------------------------------------------------------
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
      if (!isFull && isActiveRef.current) {
        setFullscreenExits((prev) => prev + 1);
        reportEvent('FULLSCREEN_EXIT', 'Participant exited fullscreen mode.');
        triggerWarning('⚠️ FULLSCREEN REQUIRED: Please remain in fullscreen mode during the challenge.');
      }
    };

    // -------------------------------------------------------------
    // 4. Aggressive Keyboard Shortcuts & Screenshot Blockers
    // -------------------------------------------------------------
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.keyCode === 18) {
        isAltPressedRef.current = false;
      }

      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        setIsPrivacyShieldActive(true);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        reportEvent('SCREENSHOT_ATTEMPT', 'PrintScreen key capture attempted.');
        triggerWarning('⚠️ SCREENSHOT BLOCKED: Screen capture attempt logged!', true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Track Alt key status
      if (e.key === 'Alt' || e.keyCode === 18) {
        isAltPressedRef.current = true;
      }

      // 1. Alt+Tab or Alt+Any Key Interception
      if (e.altKey || isAltPressedRef.current) {
        if (e.key === 'Tab' || e.keyCode === 9 || e.key === 'F4' || e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          onFocusLost(`Alt+${e.key} key combination`);
          return;
        }
      }

      // 2. Windows / Meta Key Interception
      if (e.key === 'Meta' || e.key === 'OS' || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        onFocusLost('Windows/Meta key press');
        return;
      }

      // 3. PrintScreen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        setIsPrivacyShieldActive(true);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        reportEvent('SCREENSHOT_ATTEMPT', 'PrintScreen key capture attempted.');
        triggerWarning('⚠️ Screen capture blocked & logged!', true);
        return;
      }

      // 4. Windows Snipping Tool (Win+Shift+S) / Mac Screenshot
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['s', '3', '4', '5'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        setIsPrivacyShieldActive(true);
        reportEvent('SCREENSHOT_ATTEMPT', 'Screen snipping shortcut attempted.');
        triggerWarning('⚠️ Screen snipping shortcut blocked!', true);
        return;
      }

      // 5. Browser Tab Switching Shortcuts (Ctrl+Tab, Ctrl+Shift+Tab, Ctrl+PageUp/Down, Ctrl+1..9)
      if (e.ctrlKey && (e.key === 'Tab' || e.key === 'PageUp' || e.key === 'PageDown' || (e.key >= '1' && e.key <= '9'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onFocusLost('Ctrl+Tab browser tab switch shortcut');
        return;
      }

      // 6. Browser Action Shortcuts (Ctrl+T, Ctrl+N, Ctrl+W, Ctrl+Shift+T, Ctrl+Shift+N, Ctrl+H, Ctrl+J, Ctrl+U, Ctrl+P, Ctrl+S)
      if (e.ctrlKey && ['t', 'n', 'w', 'h', 'j', 'u', 'p', 's', 'l', 'd', 'k', 'r'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        reportEvent('DEVTOOLS_DETECTED', `Browser shortcut Ctrl+${e.key.toUpperCase()} blocked.`);
        triggerWarning(`Shortcut Ctrl+${e.key.toUpperCase()} is disabled.`);
        return;
      }

      // 7. Copy / Cut / Paste shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        if (['c', 'x'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          setCopyAttempts((prev) => prev + 1);
          reportEvent('COPY_ATTEMPT', `Shortcut Ctrl+${e.key.toUpperCase()} blocked.`);
          triggerWarning('Copying text is restricted during this challenge.');
          return;
        }

        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          setPasteAttempts((prev) => prev + 1);
          reportEvent('PASTE_ATTEMPT', 'Shortcut Ctrl+V blocked.');
          triggerWarning('Pasting external text is prohibited.');
          return;
        }
      }

      // 8. F-Keys (F1..F12) Developer Tools, Refresh, Fullscreen
      if (/^F[1-9]|F1[0-2]$/.test(e.key)) {
        if (e.key !== 'F11') { // Allow F11 for native fullscreen toggle if needed
          e.preventDefault();
          e.stopPropagation();
          reportEvent('DEVTOOLS_DETECTED', `Function key ${e.key} blocked.`);
          triggerWarning(`${e.key} key is disabled.`);
          return;
        }
      }

      // 9. Inspect Elements (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c', 'k'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        reportEvent('DEVTOOLS_DETECTED', 'Developer Tools / Console shortcut blocked.');
        triggerWarning('Developer Tools access is strictly prohibited.');
        return;
      }
    };

    // -------------------------------------------------------------
    // 5. Right-Click Context Menu & Clipboard Blockers
    // -------------------------------------------------------------
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportEvent('RIGHT_CLICK', 'Right-click context menu attempted.');
      triggerWarning('Right-click context menu is disabled.');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      setCopyAttempts((prev) => prev + 1);
      reportEvent('COPY_ATTEMPT', 'Clipboard copy event intercepted.');
      triggerWarning('Text copying is restricted.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      setCopyAttempts((prev) => prev + 1);
      reportEvent('CUT_ATTEMPT', 'Clipboard cut event intercepted.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      setPasteAttempts((prev) => prev + 1);
      reportEvent('PASTE_ATTEMPT', 'Clipboard paste event intercepted.');
      triggerWarning('Pasting text into editor is restricted.');
    };

    const handleBeforeInput = (e: any) => {
      if (
        e.inputType === 'insertFromPaste' ||
        e.inputType === 'insertFromDrop' ||
        e.inputType === 'insertReplacementText'
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setPasteAttempts((prev) => prev + 1);
        reportEvent('PASTE_ATTEMPT', `Synthetic input '${e.inputType}' intercepted.`);
        triggerWarning('Pasting external text is restricted.');
      }
    };

    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      reportEvent('PASTE_ATTEMPT', 'Drag and drop text insertion blocked.');
    };

    // Attach listeners with capture phase
    window.addEventListener('pointerdown', handleInPageInteraction, true);
    window.addEventListener('mousedown', handleInPageInteraction, true);
    window.addEventListener('touchstart', handleInPageInteraction, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    window.addEventListener('blur', handleWindowBlur, true);
    window.addEventListener('focus', handleWindowFocus, true);
    window.addEventListener('pagehide', handlePageHide, true);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCut, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('beforeinput', handleBeforeInput, true);
    document.addEventListener('dragover', handleDragOver, true);
    document.addEventListener('drop', handleDrop, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      clearInterval(focusPollerInterval);

      window.removeEventListener('pointerdown', handleInPageInteraction, true);
      window.removeEventListener('mousedown', handleInPageInteraction, true);
      window.removeEventListener('touchstart', handleInPageInteraction, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      window.removeEventListener('blur', handleWindowBlur, true);
      window.removeEventListener('focus', handleWindowFocus, true);
      window.removeEventListener('pagehide', handlePageHide, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCut, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('beforeinput', handleBeforeInput, true);
      document.removeEventListener('dragover', handleDragOver, true);
      document.removeEventListener('drop', handleDrop, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [isActive, reportEvent, triggerWarning]);

  return {
    isFullscreen,
    isPrivacyShieldActive,
    tabSwitches,
    fullscreenExits,
    copyAttempts,
    pasteAttempts,
    violationState,
    acknowledgeViolation,
    requestFullscreen,
  };
}
