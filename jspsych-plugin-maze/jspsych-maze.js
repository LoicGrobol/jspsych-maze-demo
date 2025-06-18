var jsPsychMaze = (function (jspsych) {
  "use strict";

  var version = "0.0.1";

  const info = {
    name: "maze",
    version,
    parameters: {
      /** Array of [word, foil] couples */
      sentence: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
      },
      /** Object with key "text", "correct", "wrong". Can't give a schema or it gets non-nullable. **/
      question: {
        type: jspsych.ParameterType.COMPLEX,
        default: null,
      },
      canvas_style: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Extra canvas style",
        default: "border: 0px solid black;",
      },
      canvas_colour: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Canvas colour",
        default: "white",
      },
      canvas_size: {
        type: jspsych.ParameterType.INT,
        array: true,
        pretty_name: "Canvas size",
        default: [1280, 960],
      },
      /** How long to wait on a blank screen before displaying the question. */
      end_interval: {
        type: jspsych.ParameterType.INT,
        pretty_name: "End interval",
        default: 0,
      },
      font_colour: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Font colour",
        default: "black",
      },
      font_style: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Font size",
        default: "normal 24px monospace",
      },
      /** Whether to stop the trial on the first error and go directly to the question (if any) or
       * exit. */
      halt_on_error: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Halt on error",
        default: false,
      },
      /** How long to wait on a blank screen before displaying the next word. */
      inter_word_interval: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Inter-words interval",
        default: 0,
      },
      keys: {
        type: jspsych.ParameterType.COMPLEX,
        pretty_name: "Validation keys",
        default: { left: "f", right: "j" },
        nested: {
          left: {
            type: jspsych.ParameterType.STRING,
            pretty_name: "Left key",
          },
          right: {
            type: jspsych.ParameterType.STRING,
            pretty_name: "Right key",
          },
        },
      },
      position_left: {
        type: jspsych.ParameterType.COMPLEX,
        pretty_name: "Position of the left element.",
        default: { x: null, y: null },
        nested: {
          x: {
            type: jspsych.ParameterType.FLOAT,
            pretty_name: "Horizontal position",
          },
        },
        y: {
          type: jspsych.ParameterType.FLOAT,
          pretty_name: "Vertical position",
        },
      },
      position_right: {
        type: jspsych.ParameterType.COMPLEX,
        pretty_name: "Position of the right element ",
        default: { x: null, y: null },
        nested: {
          x: {
            type: jspsych.ParameterType.FLOAT,
            pretty_name: "Horizontal position",
          },
        },
        y: {
          type: jspsych.ParameterType.FLOAT,
          pretty_name: "Vertical position",
        },
      },
      /** The minimum time (in ms) before the subject is allowed to chose a word. */
      pre_answer_interval: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Waiting time",
        default: 0,
      },
      translate_origin: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Translate origin",
        default: true,
      },
    },
    data: {
      sentence: {
        type: jspsych.ParameterType.STRING,
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
          word_number: { type: jspsych.ParameterType.INT },
        },
        question: {
          type: jspsych.ParameterType.COMPLEX,
        },
      },
    },
    // prettier-ignore
    citations: {
      "apa": "",
      "bibtex": ""
    },
  };
  function set_canvas(canvas, ctx, colour, translate_origin) {
    let canvas_rect;
    if (translate_origin) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      canvas_rect = [
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height,
      ];
    } else {
      canvas_rect = [0, 0, canvas.width, canvas.height];
    }
    ctx.fillStyle = colour;
    ctx.fillRect(
      canvas_rect[0],
      canvas_rect[1],
      canvas_rect[2],
      canvas_rect[3]
    );
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
      this.display_element = display_element;
      this.display_element.innerHTML = `<div>
      <canvas
        id="canvas"
        width="${trial.canvas_size[0]}"
        height="${trial.canvas_size[1]}"
        style="${trial.canvas_style}"
      ></canvas>
      </div>`;
      this.canvas = document.getElementById("canvas");
      this.canvas_colour = trial.canvas_colour;
      this.ctx = this.canvas.getContext("2d");
      this.ctx.font = trial.font_style;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.canvas_rect = set_canvas(
        this.canvas,
        this.ctx,
        this.canvas_colour,
        trial.translate_origin
      );
      this.canvas_center = {
        x: this.canvas_rect[0] + this.canvas_rect[2] / 2,
        y: this.canvas_rect[1] + this.canvas_rect[3] / 2,
      };
      this.font_colour = trial.font_colour;
      this.keys = trial.keys;
      this.position_left = {
        x:
          trial.position_left.x !== null
            ? trial.position_left.x
            : this.canvas_rect[0] + this.canvas_rect[2] / 3,
        y:
          trial.position_left.y !== null
            ? trial.position_left.y
            : this.canvas_center.y,
      };
      this.position_right = {
        x:
          trial.position_right.x !== null
            ? trial.position_right.x
            : this.canvas_rect[0] + (2 * this.canvas_rect[2]) / 3,
        y:
          trial.position_right.y !== null
            ? trial.position_right.y
            : this.canvas_center.y,
      };
      this.position_text = {
        x: this.canvas_center.x,
        y: (this.canvas_center.y + this.canvas_rect[1]) / 2,
      };
      const results = {
        sentence: trial.sentence.map((x) => x[0]).join(" "),
        events: [],
        question: null,
      };
      let last_display_time;
      let word_number = 0;
      const word_on_the_left = Array.from(
        { length: trial.sentence.length },
        (_value, _index) => Math.random() < 0.5
      );
      const ask_question = () => {
        const correct_on_the_left = Math.random() < 0.5;
        const [left, right] = correct_on_the_left
          ? [trial.question.correct, trial.question.wrong]
          : [trial.question.wrong, trial.question.correct];
        this.display_words(left, right, trial.question.text);
        this.keyboard_listener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: (info2) => {
            results.question = {
              question: trial.question,
              correct: correct_on_the_left
                ? info2.key == this.keys.left
                : info2.key == this.keys.right,
              rt: info2.rt,
            };
            end_trial();
          },
          valid_responses: [this.keys.left, this.keys.right],
          rt_method: "performance",
          persist: true,
          allow_held_key: false,
        });
      };
      const step_display = (n) => {
        const [word, foil] = trial.sentence[n];
        const [left, right] = word_on_the_left[n] ? [word, foil] : [foil, word];
        this.display_words(left, right);
      };
      const after_response = (info2) => {
        const rt = info2.rt - last_display_time;
        const correct = word_on_the_left[word_number]
          ? info2.key == this.keys.left
          : info2.key == this.keys.right;
        const [word, foil] = trial.sentence[word_number];
        results.events.push({
          correct,
          foil,
          rt,
          side: word_on_the_left[word_number] ? "left" : "right",
          word,
        });
        if (
          word_number < trial.sentence.length - 1 &&
          (correct || !trial.halt_on_error)
        ) {
          word_number++;
          this.clear_display();
          this.jsPsych.pluginAPI.setTimeout(
            () => step_display(word_number),
            trial.inter_word_interval
          );
          last_display_time = info2.rt + trial.inter_word_interval;
        } else {
          this.jsPsych.pluginAPI.cancelKeyboardResponse(this.keyboard_listener);
          if (void 0 !== trial.question) {
            this.clear_display();
            this.jsPsych.pluginAPI.setTimeout(
              () => ask_question(),
              trial.end_interval
            );
          } else {
            end_trial();
          }
        }
      };
      const start_trial = (info2) => {
        step_display(0);
        last_display_time = 0;
        this.keyboard_listener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_response,
          valid_responses: [this.keys.left, this.keys.right],
          rt_method: "performance",
          persist: true,
          allow_held_key: false,
          minimum_valid_rt:
            trial.inter_word_interval + trial.pre_answer_interval,
        });
      };
      const end_trial = () => {
        this.jsPsych.pluginAPI.cancelKeyboardResponse(this.keyboard_listener);
        this.jsPsych.finishTrial(results);
      };
      const setup = () => {
        this.display_message(
          `Press ${this.keys.left} or ${this.keys.right} to start`
        );
        this.keyboard_listener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: start_trial,
          valid_responses: [this.keys.left, this.keys.right],
          persist: false,
          allow_held_key: false,
        });
      };
      setup();
    }
    clear_display() {
      this.ctx.fillStyle = this.canvas_colour;
      this.ctx.fillRect(...this.canvas_rect);
      this.ctx.beginPath();
    }
    display_words(left_word, right_word, text = null) {
      this.clear_display();
      this.ctx.fillStyle = this.font_colour;
      this.ctx.fillText(left_word, this.position_left.x, this.position_left.y);
      this.ctx.fillText(
        right_word,
        this.position_right.x,
        this.position_right.y
      );
      if (null !== text) {
        this.ctx.fillText(text, this.position_text.x, this.position_text.y);
      }
    }
    display_message(message) {
      this.clear_display();
      this.ctx.fillStyle = this.font_colour;
      this.ctx.fillText(message, this.canvas_center.x, this.canvas_center.y);
    }
  }

  return MazePlugin;
})(jsPsychModule);
//# sourceMappingURL=jspsych-maze.js.map
