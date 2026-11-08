/**
 * src/input/input_manager.js
 * Carrier Air Wing - Cross-Platform Virtual Controller & Semantic Input Management Engine
 * Standard: ACME Lex Superior v3.2.0 (DoF = 0, Hardware Isolation Invariant)
 * 
 * Supports:
 * - PC Keyboard (W/A/S/D, Q/E, 1/3, F/G/H/J, Space, Escape, Tab/M)
 * - Standard Gamepad API (Xbox / XInput & PlayStation DualShock/DualSense)
 * - Auto device detection with dynamic glyph adaptation
 * - Full interactive remapping with localStorage persistence
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CAWInputManager = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Action Identifiers
  const ACTIONS = {
    NAV_UP: 'NAV_UP',
    NAV_DOWN: 'NAV_DOWN',
    NAV_LEFT: 'NAV_LEFT',
    NAV_RIGHT: 'NAV_RIGHT',
    BTN_L1: 'BTN_L1', // Tab Switch Left
    BTN_R1: 'BTN_R1', // Tab Switch Right
    BTN_L2: 'BTN_L2', // Page Switch Prev
    BTN_R2: 'BTN_R2', // Page Switch Next
    ACT_PRIMARY: 'ACT_PRIMARY',     // Function F / A Button
    ACT_SECONDARY: 'ACT_SECONDARY', // Function G / B Button
    ACT_SPECIAL: 'ACT_SPECIAL',     // Function H / X Button
    ACT_UTILITY: 'ACT_UTILITY',     // Function J / Y Button
    SYS_PAUSE: 'SYS_PAUSE',         // Escape / Start
    SYS_MENU: 'SYS_MENU'            // Tab or M / Select/Back
  };

  // Hardware Default Presets
  const PRESET_KEYBOARD_DEFAULT = {
    [ACTIONS.NAV_UP]: { code: 'KeyW', altCode: 'ArrowUp', label: 'W' },
    [ACTIONS.NAV_DOWN]: { code: 'KeyS', altCode: 'ArrowDown', label: 'S' },
    [ACTIONS.NAV_LEFT]: { code: 'KeyA', altCode: 'ArrowLeft', label: 'A' },
    [ACTIONS.NAV_RIGHT]: { code: 'KeyD', altCode: 'ArrowRight', label: 'D' },
    [ACTIONS.BTN_L1]: { code: 'KeyQ', altCode: '', label: 'Q' },
    [ACTIONS.BTN_R1]: { code: 'KeyE', altCode: '', label: 'E' },
    [ACTIONS.BTN_L2]: { code: 'Digit1', altCode: '', label: '1' },
    [ACTIONS.BTN_R2]: { code: 'Digit3', altCode: '', label: '3' },
    [ACTIONS.ACT_PRIMARY]: { code: 'KeyF', altCode: 'Space', label: 'F/SPC' },
    [ACTIONS.ACT_SECONDARY]: { code: 'KeyG', altCode: '', label: 'G' },
    [ACTIONS.ACT_SPECIAL]: { code: 'KeyH', altCode: '', label: 'H' },
    [ACTIONS.ACT_UTILITY]: { code: 'KeyJ', altCode: '', label: 'J' },
    [ACTIONS.SYS_PAUSE]: { code: 'Escape', altCode: '', label: 'ESC' },
    [ACTIONS.SYS_MENU]: { code: 'KeyM', altCode: 'Tab', label: 'M' }
  };

  // Standard Gamepad Button Index Mapping (W3C Standard Gamepad Specification)
  const GAMEPAD_BUTTON_MAP = {
    [ACTIONS.ACT_PRIMARY]: 0,    // A (Xbox) / Cross (PS)
    [ACTIONS.ACT_SECONDARY]: 1,  // B (Xbox) / Circle (PS)
    [ACTIONS.ACT_SPECIAL]: 2,    // X (Xbox) / Square (PS)
    [ACTIONS.ACT_UTILITY]: 3,    // Y (Xbox) / Triangle (PS)
    [ACTIONS.BTN_L1]: 4,         // LB (Xbox) / L1 (PS)
    [ACTIONS.BTN_R1]: 5,         // RB (Xbox) / R1 (PS)
    [ACTIONS.BTN_L2]: 6,         // LT (Xbox) / L2 (PS)
    [ACTIONS.BTN_R2]: 7,         // RT (Xbox) / R2 (PS)
    [ACTIONS.SYS_MENU]: 8,       // Back/View (Xbox) / Share/Create (PS)
    [ACTIONS.SYS_PAUSE]: 9,      // Start/Menu (Xbox) / Options (PS)
    [ACTIONS.NAV_UP]: 12,        // D-Pad Up
    [ACTIONS.NAV_DOWN]: 13,      // D-Pad Down
    [ACTIONS.NAV_LEFT]: 14,      // D-Pad Left
    [ACTIONS.NAV_RIGHT]: 15      // D-Pad Right
  };

  // Glyph Labels for Devices
  const DEVICE_GLYPHS = {
    KEYBOARD: {
      [ACTIONS.NAV_UP]: 'W',
      [ACTIONS.NAV_DOWN]: 'S',
      [ACTIONS.NAV_LEFT]: 'A',
      [ACTIONS.NAV_RIGHT]: 'D',
      [ACTIONS.BTN_L1]: 'Q',
      [ACTIONS.BTN_R1]: 'E',
      [ACTIONS.BTN_L2]: '1',
      [ACTIONS.BTN_R2]: '3',
      [ACTIONS.ACT_PRIMARY]: 'F',
      [ACTIONS.ACT_SECONDARY]: 'G',
      [ACTIONS.ACT_SPECIAL]: 'H',
      [ACTIONS.ACT_UTILITY]: 'J',
      [ACTIONS.SYS_PAUSE]: 'ESC',
      [ACTIONS.SYS_MENU]: 'M'
    },
    XBOX: {
      [ACTIONS.NAV_UP]: '▲',
      [ACTIONS.NAV_DOWN]: '▼',
      [ACTIONS.NAV_LEFT]: '◄',
      [ACTIONS.NAV_RIGHT]: '►',
      [ACTIONS.BTN_L1]: 'LB',
      [ACTIONS.BTN_R1]: 'RB',
      [ACTIONS.BTN_L2]: 'LT',
      [ACTIONS.BTN_R2]: 'RT',
      [ACTIONS.ACT_PRIMARY]: 'A',
      [ACTIONS.ACT_SECONDARY]: 'B',
      [ACTIONS.ACT_SPECIAL]: 'X',
      [ACTIONS.ACT_UTILITY]: 'Y',
      [ACTIONS.SYS_PAUSE]: 'START',
      [ACTIONS.SYS_MENU]: 'VIEW'
    },
    PLAYSTATION: {
      [ACTIONS.NAV_UP]: '▲',
      [ACTIONS.NAV_DOWN]: '▼',
      [ACTIONS.NAV_LEFT]: '◄',
      [ACTIONS.NAV_RIGHT]: '►',
      [ACTIONS.BTN_L1]: 'L1',
      [ACTIONS.BTN_R1]: 'R1',
      [ACTIONS.BTN_L2]: 'L2',
      [ACTIONS.BTN_R2]: 'R2',
      [ACTIONS.ACT_PRIMARY]: '✕',
      [ACTIONS.ACT_SECONDARY]: '○',
      [ACTIONS.ACT_SPECIAL]: '□',
      [ACTIONS.ACT_UTILITY]: '△',
      [ACTIONS.SYS_PAUSE]: 'OPT',
      [ACTIONS.SYS_MENU]: 'SHARE'
    }
  };

  const STORAGE_KEY = 'caw_custom_keymap';

  class InputManager {
    constructor() {
      this.activeDevice = 'KEYBOARD'; // 'KEYBOARD' | 'XBOX' | 'PLAYSTATION'
      this.connectedGamepadIndex = null;
      this.rawKeyStates = {};
      this.actionStates = {};
      this.customKeyMap = this.loadCustomKeyMap();

      // Listeners
      this.setupKeyboardListeners();
      this.setupGamepadListeners();

      // Initialize action states
      for (const a in ACTIONS) {
        this.actionStates[ACTIONS[a]] = false;
      }
    }

    loadCustomKeyMap() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return Object.assign({}, PRESET_KEYBOARD_DEFAULT, JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Could not read custom keymap from localStorage', e);
      }
      return Object.assign({}, PRESET_KEYBOARD_DEFAULT);
    }

    saveCustomKeyMap() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customKeyMap));
      } catch (e) {
        console.warn('Could not save custom keymap to localStorage', e);
      }
    }

    resetToDefault() {
      this.customKeyMap = Object.assign({}, PRESET_KEYBOARD_DEFAULT);
      localStorage.removeItem(STORAGE_KEY);
    }

    setupKeyboardListeners() {
      window.addEventListener('keydown', (e) => {
        // Switch active device back to KEYBOARD immediately
        this.activeDevice = 'KEYBOARD';
        this.rawKeyStates[e.code] = true;
      });

      window.addEventListener('keyup', (e) => {
        this.rawKeyStates[e.code] = false;
      });
    }

    setupGamepadListeners() {
      window.addEventListener('gamepadconnected', (e) => {
        this.connectedGamepadIndex = e.gamepad.index;
        const idLower = (e.gamepad.id || '').toLowerCase();
        if (idLower.includes('sony') || idLower.includes('dualsense') || idLower.includes('dualshock') || idLower.includes('054c')) {
          this.activeDevice = 'PLAYSTATION';
        } else {
          this.activeDevice = 'XBOX';
        }
        console.log(`[InputManager] Gamepad connected: ${e.gamepad.id} -> Activated: ${this.activeDevice}`);
      });

      window.addEventListener('gamepaddisconnected', (e) => {
        if (this.connectedGamepadIndex === e.gamepad.index) {
          this.connectedGamepadIndex = null;
          this.activeDevice = 'KEYBOARD';
          console.log('[InputManager] Gamepad disconnected -> Switched to KEYBOARD');
        }
      });
    }

    /**
     * Poll gamepads and update action states per frame
     */
    update() {
      // 1. Reset all action states
      for (const a in ACTIONS) {
        this.actionStates[ACTIONS[a]] = false;
      }

      // 2. Poll Gamepad if present
      let gamepad = null;
      if (navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        if (this.connectedGamepadIndex !== null && gamepads[this.connectedGamepadIndex]) {
          gamepad = gamepads[this.connectedGamepadIndex];
        } else {
          for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && gamepads[i].connected) {
              gamepad = gamepads[i];
              this.connectedGamepadIndex = i;
              break;
            }
          }
        }
      }

      if (gamepad) {
        // Check if any button or axis is moved; if so, switch device to controller
        let controllerEngaged = false;

        // Button check
        for (const [actionId, btnIndex] of Object.entries(GAMEPAD_BUTTON_MAP)) {
          if (gamepad.buttons[btnIndex] && gamepad.buttons[btnIndex].pressed) {
            this.actionStates[actionId] = true;
            controllerEngaged = true;
          }
        }

        // Stick check (Axes 0, 1) with deadzone 0.2
        const deadzone = 0.2;
        const stickX = gamepad.axes[0] || 0;
        const stickY = gamepad.axes[1] || 0;

        if (Math.abs(stickX) > deadzone || Math.abs(stickY) > deadzone) {
          controllerEngaged = true;
          if (stickX < -deadzone) this.actionStates[ACTIONS.NAV_LEFT] = true;
          if (stickX > deadzone) this.actionStates[ACTIONS.NAV_RIGHT] = true;
          if (stickY < -deadzone) this.actionStates[ACTIONS.NAV_UP] = true;
          if (stickY > deadzone) this.actionStates[ACTIONS.NAV_DOWN] = true;
        }

        if (controllerEngaged && this.activeDevice === 'KEYBOARD') {
          const idLower = (gamepad.id || '').toLowerCase();
          this.activeDevice = (idLower.includes('sony') || idLower.includes('dualsense') || idLower.includes('dualshock') || idLower.includes('054c'))
            ? 'PLAYSTATION'
            : 'XBOX';
        }
      }

      // 3. Combine with Keyboard states
      for (const [actionId, binding] of Object.entries(this.customKeyMap)) {
        if (this.rawKeyStates[binding.code] || (binding.altCode && this.rawKeyStates[binding.altCode])) {
          this.actionStates[actionId] = true;
          this.activeDevice = 'KEYBOARD';
        }
      }
    }

    /**
     * Query API: isActionDown(actionId) -> Boolean
     */
    isActionDown(actionId) {
      return !!this.actionStates[actionId];
    }

    /**
     * Semantic alias for isActionDown
     */
    isAction(actionId) {
      return !!this.actionStates[actionId];
    }

    /**
     * Raw key down query API: isDown(code) / isKeyDown(code) -> Boolean
     * E.g. isDown('KeyA'), isDown('KeyQ')
     */
    isDown(code) {
      return !!this.rawKeyStates[code];
    }

    isKeyDown(code) {
      return !!this.rawKeyStates[code];
    }

    /**
     * Query API: getMovementVector() -> { x, y } (-1.0 to 1.0 normalized)
     */
    getMovementVector() {
      let vx = 0;
      let vy = 0;

      if (this.actionStates[ACTIONS.NAV_LEFT]) vx -= 1;
      if (this.actionStates[ACTIONS.NAV_RIGHT]) vx += 1;
      if (this.actionStates[ACTIONS.NAV_UP]) vy += 1;
      if (this.actionStates[ACTIONS.NAV_DOWN]) vy -= 1;

      // Also check analog gamepad stick directly if available
      if (this.connectedGamepadIndex !== null && navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.connectedGamepadIndex];
        if (gp) {
          const deadzone = 0.18;
          const ax = gp.axes[0] || 0;
          const ay = gp.axes[1] || 0;
          if (Math.abs(ax) > deadzone || Math.abs(ay) > deadzone) {
            vx = ax;
            vy = -ay; // Invert stick Y so forward is positive Y
          }
        }
      }

      // Normalize diagonal vectors
      const len = Math.sqrt(vx * vx + vy * vy);
      if (len > 1.0) {
        vx /= len;
        vy /= len;
      }

      return { x: vx, y: vy };
    }

    /**
     * Query API: getActiveDevice() -> 'KEYBOARD' | 'XBOX' | 'PLAYSTATION'
     */
    getActiveDevice() {
      return this.activeDevice;
    }

    /**
     * Get visual label for action based on currently active device
     */
    getGlyphForAction(actionId) {
      if (this.activeDevice === 'KEYBOARD') {
        const binding = this.customKeyMap[actionId];
        return binding ? (binding.label || binding.code.replace('Key', '')) : '?';
      }
      const deviceMap = DEVICE_GLYPHS[this.activeDevice];
      return (deviceMap && deviceMap[actionId]) || '?';
    }

    /**
     * Remap key for an action
     */
    remapKey(actionId, newCode, newLabel) {
      if (this.customKeyMap[actionId]) {
        this.customKeyMap[actionId].code = newCode;
        this.customKeyMap[actionId].label = newLabel || newCode.replace('Key', '');
        this.saveCustomKeyMap();
      }
    }
  }

  // Export class and Action enums
  InputManager.ACTIONS = ACTIONS;
  InputManager.DEVICE_GLYPHS = DEVICE_GLYPHS;
  return InputManager;
}));

