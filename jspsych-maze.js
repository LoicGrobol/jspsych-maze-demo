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
      canvas_border: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Canvas border",
        default: "0px solid black"
      },
      canvas_colour: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Canvas colour",
        default: "white"
      },
      canvas_size: {
        type: jspsych.ParameterType.INT,
        array: true,
        pretty_name: "Canvas size",
        default: [1280, 960]
      },
      font_colour: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Font colour",
        default: "black"
      },
      font_family: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Font family",
        default: "monospace"
      },
      font_size: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Font size",
        default: "24px"
      },
      font_weight: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Font weight",
        default: "normal"
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
      position_left: {
        type: jspsych.ParameterType.COMPLEX,
        pretty_name: "Position of the left element.",
        default: { x: null, y: null },
        nested: {
          x: {
            type: jspsych.ParameterType.FLOAT,
            pretty_name: "Horizontal position"
          }
        },
        y: {
          type: jspsych.ParameterType.FLOAT,
          pretty_name: "Vertical position"
        }
      },
      position_right: {
        type: jspsych.ParameterType.COMPLEX,
        pretty_name: "Position of the right element ",
        default: { x: null, y: null },
        nested: {
          x: {
            type: jspsych.ParameterType.FLOAT,
            pretty_name: "Horizontal position"
          }
        },
        y: {
          type: jspsych.ParameterType.FLOAT,
          pretty_name: "Vertical position"
        }
      },
      translate_origin: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Translate origin",
        default: true
      },
      /** How long to wait after showing a word and before registering keypresses (in ms) */
      waiting_time: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Waiting time",
        default: 0
      }
    },
    data: {
      /** TODO: Provide a clear description of the data1 that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
      report: {
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
  function set_canvas(canvas, ctx, colour, translate_origin) {
    let canvas_rect;
    if (translate_origin) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      canvas_rect = [-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height];
    } else {
      canvas_rect = [0, 0, canvas.width, canvas.height];
    }
    ctx.fillStyle = colour;
    ctx.fillRect(canvas_rect[0], canvas_rect[1], canvas_rect[2], canvas_rect[3]);
    ctx.beginPath();
    return canvas_rect;
  }
  class MazePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    static {
      this.info = info;
    }
    trial(display_element, trial) {
      display_element.innerHTML = `<div>
      <canvas
        id="canvas"
        width="${trial.canvas_size[0]}"
        height="${trial.canvas_size[1]}"
        style="border:${trial.canvas_border};"
      ></canvas>
      </div>`;
      const sentence_font = `${trial.font_weight} ${trial.font_size} ${trial.font_family}`;
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");
      const canvas_rect = set_canvas(canvas, ctx, trial.canvas_colour, trial.translate_origin);
      const canvas_center = {
        x: canvas_rect[0] + canvas_rect[2] / 2,
        y: canvas_rect[1] + canvas_rect[3] / 2
      };
      const position_left = {
        x: trial.position_left.x !== null ? trial.position_left.x : canvas_rect[0] + canvas_rect[2] / 3,
        y: trial.position_left.y !== null ? trial.position_left.y : canvas_center.y
      };
      const position_right = {
        x: trial.position_right.x !== null ? trial.position_right.x : canvas_rect[0] + 2 * canvas_rect[2] / 3,
        y: trial.position_right.y !== null ? trial.position_right.y : canvas_center.y
      };
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let word_on_the_left;
      let word_number;
      let last_display_time;
      let trial_data = {
        sentence: trial.sentence.map((x) => x[0]).join(" "),
        events: []
      };
      let keyboardListener;
      const clear_canvas = () => {
        ctx.font = trial.canvas_colour;
        ctx.fillStyle = trial.canvas_colour;
        ctx.fillRect(canvas_rect[0], canvas_rect[1], canvas_rect[2], canvas_rect[3]);
        ctx.beginPath();
      };
      const display_word = (left_word, right_word) => {
        clear_canvas();
        ctx.font = sentence_font;
        ctx.fillStyle = trial.font_colour;
        ctx.fillText(left_word, position_left.x, position_left.y);
        ctx.fillText(right_word, position_right.x, position_right.y);
      };
      const display_message = (message) => {
        clear_canvas();
        ctx.font = sentence_font;
        ctx.fillStyle = trial.font_colour;
        ctx.fillText(message, canvas_center.x, canvas_center.y);
      };
      const after_response = (info2) => {
        if (void 0 === last_display_time) {
          last_display_time = 0;
        }
        const rt = info2.rt - last_display_time;
        if (rt < trial.waiting_time) {
          return;
        }
        if (word_number >= 0) {
          const correct = word_on_the_left[word_number] ? info2.key == trial.keys.left : info2.key == trial.keys.righ;
          const [word, foil] = trial.sentence[word_number];
          trial_data.events.push({
            correct,
            foil,
            rt,
            side: word_on_the_left[word_number] ? "left" : "right",
            word,
            word_number
          });
        }
        if (word_number < trial.sentence.length - 1) {
          word_number++;
          const [word, foil] = trial.sentence[word_number];
          const [left, right] = word_on_the_left[word_number] ? [word, foil] : [foil, word];
          display_word(left, right);
          last_display_time = info2.rt;
        } else {
          end_trial();
        }
      };
      const start_trial = () => {
        word_number = -1;
        word_on_the_left = Array.from(
          { length: trial.sentence.length },
          (_value, _index) => Math.random() < 0.5
        );
        display_message(`Press ${trial.keys.left} or ${trial.keys.right} to start`);
        keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_response,
          valid_responses: [trial.keys.left, trial.keys.right],
          rt_method: "performance",
          persist: true,
          allow_held_key: false
        });
      };
      const end_trial = () => {
        this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
        this.jsPsych.finishTrial(trial_data);
      };
      start_trial();
    }
  }

  return MazePlugin;

})(jsPsychModule);
//# sourceMappingURL=jspsych-mazer.js.map
