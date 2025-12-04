var jsPsychMaze = (function (jspsych) {
  'use strict';

  var version = "0.0.1";

  const info = {
    name: "maze",
    version,
    parameters: {
      /** Array of [word, foil] couples */
      sentence: {
        type: jspsych.ParameterType.COMPLEX,
        array: true
      },
      canvas_size: {
        type: jspsych.ParameterType.STRING,
        array: true,
        pretty_name: "Canvas size",
        default: ["100vw", "100vh"]
      },
      /** Whether to stop the trial on the first error.*/
      halt_on_error: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Halt on error",
        default: false
      },
      /** The instruction to display at the beginning of the trial */
      instruction: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Instruction",
        default: null
      },
      /** How long to wait on a blank screen before displaying the next word. */
      inter_word_interval: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Inter-words interval",
        default: 0
      },
      keys: {
        type: jspsych.ParameterType.COMPLEX,
        pretty_name: "Validation keys",
        default: { left: "f", right: "j" },
        nested: {
          left: {
            type: jspsych.ParameterType.STRING,
            pretty_name: "Left key"
          },
          right: {
            type: jspsych.ParameterType.STRING,
            pretty_name: "Right key"
          }
        }
      },
      /** The minimum time (in ms) before the subject is allowed to chose a word. */
      pre_answer_interval: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Pre-answer Interval",
        default: 0
      }
    },
    data: {
      sentence: {
        type: jspsych.ParameterType.STRING
      },
      events: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        nested: {
          correct: { type: jspsych.ParameterType.BOOL },
          foil: { type: jspsych.ParameterType.STRING },
          rt: { type: jspsych.ParameterType.INT },
          side: { type: jspsych.ParameterType.STRING },
          word: { type: jspsych.ParameterType.STRING },
          word_number: { type: jspsych.ParameterType.INT }
        }
      }
    },
    // prettier-ignore
    citations: {
      "apa": "",
      "bibtex": ""
    }
  };
  class MazePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    static {
      this.info = info;
    }
    trial(display_element, trial) {
      this.display_element = display_element;
      this.display_element.innerHTML = `
      <div id="jspsych-maze-display_parent">
        <div id="jspsych-maze-center_display" class="jspsych-maze-display"></div>
        <div id="jspsych-maze-text_display" class="jspsych-maze-display"></div>
        <div id="jspsych-maze-left_display" class="jspsych-maze-display jspsy-maze-answer"></div>
        <div id="jspsych-maze-right_display" class="jspsych-maze-display jspsy-maze-answer"></div>
      </div>`;
      this.style = document.createElement("style");
      this.style.innerHTML = `
		html, body { overscroll-behavior-y: contain; }
		#jspsych-maze-display_parent {
			position: relative;
			width: ${trial.canvas_size[0]};
			height: ${trial.canvas_size[1]};
		}
		.jspsych-maze-display{
			position: absolute;
		}
		.jspsych-maze-answer{
			width: max-content;
		}
		.highlighted {
			border: 2px solid red;
		}
		#jspsych-maze-center_display {
			top: 50%;
			transform: translateY(-50%);
			width: 100%;
		}
		#jspsych-maze-text_display {
			top: 50%;
			transform: translateY(-50%) translateY(-5em);
			width: 100%;
		}
		#jspsych-maze-left_display {
			left: calc(100% / 3);
			top: 50%;
			transform: translate(-50%, -50%);
		}
		#jspsych-maze-right_display {
			left: calc(2 * (100% / 3));
			top: 50%;
			transform: translate(-50%, -50%);
		}
      `;
      document.head.appendChild(this.style);
      this.display_parent = document.getElementById("jspsych-maze-display_parent");
      this.center_clientX = this.display_element.clientLeft + 0.5 * this.display_element.clientWidth;
      this.center_display = document.getElementById("jspsych-maze-center_display");
      this.left_display = document.getElementById("jspsych-maze-left_display");
      this.right_display = document.getElementById("jspsych-maze-right_display");
      this.text_display = document.getElementById("jspsych-maze-text_display");
      this.keys = trial.keys;
      console.log(trial);
      this.instruction = trial.instruction ?? `Press ${this.keys.left} or ${this.keys.right} to start`;
      const results = {
        sentence: trial.sentence.map((x) => x[0]).join(" "),
        events: []
      };
      const word_on_the_left = Array.from(
        { length: trial.sentence.length },
        (_value, _index) => Math.random() < 0.5
      );
      const listen_input = (callback) => {
        const cancelers = [];
        const next = (input_type, response_is_left) => {
          for (const handle of cancelers) {
            handle();
          }
          callback(response_is_left);
        };
        const keyboard_listener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: (info2) => {
            next("keyboard", this.jsPsych.pluginAPI.compareKeys(info2.key, this.keys.left));
          },
          valid_responses: [this.keys.left, this.keys.right],
          rt_method: "performance",
          allow_held_key: false
        });
        cancelers.push(() => this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener));
        const swipe_listener = listen_to_swipe(
          this.jsPsych.getDisplayContainerElement(),
          (response_is_left) => {
            this.left_display.classList.remove("highlighted");
            this.right_display.classList.remove("highlighted");
            next("touch", response_is_left);
          },
          {
            move_callback: (start_touch, current_touch) => {
              if (current_touch.pageX < start_touch.pageX) {
                this.left_display.classList.add("highlighted");
                this.right_display.classList.remove("highlighted");
              } else {
                this.left_display.classList.remove("highlighted");
                this.right_display.classList.add("highlighted");
              }
            }
          }
        );
        cancelers.push(swipe_listener);
      };
      const start_step = (word_number) => {
        const [word, foil] = trial.sentence[word_number];
        const [left, right] = word_on_the_left[word_number] ? [word, foil] : [foil, word];
        this.display_words(left, right);
        const last_display_time = performance.now();
        this.jsPsych.pluginAPI.setTimeout(
          () => listen_input((response_is_left) => {
            process_response(performance.now() - last_display_time, word_number, response_is_left);
          }),
          trial.pre_answer_interval
        );
      };
      const process_response = (interval, word_number, response_is_left) => {
        const correct = word_on_the_left[word_number] === response_is_left;
        const [word, foil] = trial.sentence[word_number];
        results.events.push({
          correct,
          foil,
          rt: interval,
          side: word_on_the_left[word_number] ? "left" : "right",
          word
        });
        if (word_number < trial.sentence.length - 1 && (correct || !trial.halt_on_error)) {
          this.clear_display();
          this.jsPsych.pluginAPI.setTimeout(
            () => start_step(word_number + 1),
            trial.inter_word_interval
          );
        } else {
          end_trial();
        }
      };
      const start_trial = () => {
        start_step(0);
      };
      const end_trial = () => {
        this.jsPsych.finishTrial(results);
      };
      const setup = () => {
        this.display_message(
          this.instruction
        );
        listen_input((_) => start_trial());
      };
      setup();
    }
    clear_display() {
      this.center_display.innerHTML = "";
      this.left_display.innerHTML = "";
      this.right_display.innerHTML = "";
      this.text_display.innerHTML = "";
    }
    display_words(left_word, right_word, text = null) {
      this.clear_display();
      this.left_display.innerHTML = left_word;
      this.right_display.innerHTML = right_word;
      if (null !== text) {
        this.text_display.innerHTML = text;
      }
    }
    display_message(message) {
      this.clear_display();
      this.center_display.innerHTML = message;
    }
  }
  function listen_to_swipe(element, callback, options = {}) {
    const min_distance = options.min_distance ?? 0;
    const touch_controller = new AbortController();
    const ongoingTouches = /* @__PURE__ */ new Map();
    element.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
          ongoingTouches.set(touch.identifier, touch);
          if (options.touch_callback) {
            options.touch_callback(touch);
          }
        }
      },
      { signal: touch_controller.signal }
    );
    element.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        if (options.move_callback) {
          for (const current_touch of e.changedTouches) {
            const start_touch = ongoingTouches.get(current_touch.identifier);
            options.move_callback(start_touch, current_touch);
          }
        }
      },
      { signal: touch_controller.signal }
    );
    element.addEventListener(
      "touchcancel",
      (e) => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
          ongoingTouches.delete(touch.identifier);
        }
      },
      { signal: touch_controller.signal }
    );
    element.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        for (const end_touch of e.changedTouches) {
          const start_touch = ongoingTouches.get(end_touch.identifier);
          if (end_touch.pageX < start_touch.pageX - min_distance) {
            callback(true);
          } else if (end_touch.pageX > start_touch.pageX + min_distance) {
            callback(false);
          }
        }
      },
      { signal: touch_controller.signal }
    );
    return () => touch_controller.abort();
  }

  return MazePlugin;

})(jsPsychModule);
//# sourceMappingURL=index.browser.js.map
