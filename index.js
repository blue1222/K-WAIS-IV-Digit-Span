import { generate_forward, generate_backward, generate_sequencing } from './sequences.js';
import { SCORE } from './score.js';
import { SCALED_SCORES } from './scaled-scores.js';

globalThis.STATE = {
  submitted: false,
  prompt: null,
  SCORE,
  maskTimeout: null,
  submissionValue: '',
};

const $ = document.querySelector.bind(document);
const $$ = function (selector) {
  return [...document.querySelectorAll(selector)];
};

document.addEventListener('DOMContentLoaded', main);

function main() {
  updateTable();

  setupMaskedInput();

  $('#years').addEventListener('input', updateTable);

  $('#submit-and-continue').addEventListener('click', () => {
    STATE.submitted = true;
    $('#submit-and-continue').disabled = true;
  });

  /** Replay last prompt. */
  $('#play').addEventListener('click', async () => {
    if ($('#play').dataset.clicked === 'false') {
      return;
    }
    $('#play').disabled = true;
    $('#submit-and-continue').disabled = true;

    await speak(STATE.prompt, 0.75);

    $('#play').disabled = false;
    $('#submit-and-continue').disabled = false;
    $('#submission').disabled = false;
    $('#pseudo-submission').focus();
  });

  /** Begin test. */
  $('#play').addEventListener('click', async () => {
    if ($('#play').dataset.clicked === 'true') {
      return;
    }

    $('#play').dataset.clicked = 'true';

    /** Forward. */
    STATE.prompt =
      // "I will now say some numbers. Listen attentively since I can't repeat them. Whenever I've finished saying them, I ask that you type them in the box below in the same order that I told them to you.";
      "이번에는 몇 개의 숫자를 불러줄 것입니다. 잘 들으십시오. 딱 한번만 불러 줄 것입니다. 제가 다 불러준 다음에 그대로 따라서 입력해 보십시오. 제가 불러준 그대로 따라 입력해야 합니다";
      await speak(STATE.prompt, 0.75);

    let forwardWrongStreak = 0;
    FORWARD: for (const [i, sequence] of Object.entries(generate_forward())) {
      for (const digit of sequence) {
        await speak(digit, 0.5);
      }
      const submission = await waitForSubmission();
      const isCorrect = submission === sequence.join('');
      STATE.SCORE.FORWARD += isCorrect;
      updateTable();
      console.log({ submission, sequence: sequence.join('') });
      console.log(`FORWARD #${+i + 1}: ${isCorrect ? 'correct' : 'wrong'}`);

      if (isCorrect) {
        forwardWrongStreak = 0;
      } else {
        forwardWrongStreak++;
        if (forwardWrongStreak === 2) {
          console.log('2 wrong answers in a row.  Ending FORWARD subtest.');
          break FORWARD;
        }
      }
    }

    /** Backward. */
    STATE.prompt =
      // "I will now say more numbers, but this time I'll ask you to repeat them in reverse order. If I were to say 7 1, what would you tell me?";
      "이번에는 몇 개의 숫자를 불러주면, 제가 다 불러 준 이후, 그것을 거꾸로 따라 입력하여 보십시오. 예를 들어 제가 7 1 이라고 하면 뭐라고 입력해야 하지요?"
    await speak(STATE.prompt, 0.75);
    $('#play').disabled = false;
    $('#play').textContent = 'REPEAT';

    const BACKWARD_PRACTICE_1 = await waitForSubmission();

    if (BACKWARD_PRACTICE_1 === '17') {
      await speak(/*"That's correct."*/"맞습니다", 0.75);
    } else {
      await speak(
        // 'That is not correct. I said 7 1, for which in reverse order the correct response was 1 7.',
        '그렇지 않습니다. 제가 7 1 이라고 말했으니까, 거꾸로 하면, 당신은 1 7 이라고 입력해야 합니다.',
        0.75
      );
    }

    STATE.prompt =
      // "Let's try again. Remember to say them in reverse order. 3 4.";
      "하나 더 해 봅시다. 제가 말한 것을 거꾸로 입력해야 한다는 것을 기억하십시오. 3 4.";
    await speak(STATE.prompt, 0.75);
    $('#play').disabled = false;

    const BACKWARD_PRACTICE_2 = await waitForSubmission();

    if (BACKWARD_PRACTICE_2 === '43') {
      await speak(/*"That's correct, let's do some more."*/"맞습니다. 좀 더 해봅시다.", 0.75);
    } else {
      await speak(
        // "That is not correct. I said 3 4, for which in reverse order the correct response was 4 3. Let's do some more.",
        "그렇지 않습니다. 제가 3 4 라고 말했으니까, 거꾸로 하면, 당신은 4 3 이라고 입력해야 합니다. 좀 더 해봅시다.",
        0.75
      );
    }

    let backwardWrongStreak = 0;
    BACKWARD: for (const [i, sequence] of Object.entries(generate_backward())) {
      for (const digit of sequence) {
        await speak(digit, 0.5);
      }
      const submission = await waitForSubmission();
      const isCorrect = submission === sequence.reverse().join('');
      STATE.SCORE.BACKWARD += isCorrect;
      updateTable();
      console.log({ submission, sequence: sequence.join('') });
      console.log(`BACKWARD #${+i + 1}: ${isCorrect ? 'correct' : 'wrong'}`);

      if (isCorrect) {
        backwardWrongStreak = 0;
      } else {
        backwardWrongStreak++;
        if (backwardWrongStreak === 2) {
          console.log('2 wrong answers in a row.  Ending BACKWARD subtest.');
          break BACKWARD;
        }
      }
    }

    /** Sequencing. */
    STATE.prompt =
      // 'I will now say more numbers. After I say them I will ask that you repeat them to me in order, beginning with the smallest number. If I tell you 2 3 1, what would you tell me?';
      '이제 제가 몇 개의 숫자를 불러줄 것입니다. 제가 다 불러준 이후에, 작은 숫자부터 순서대로 다시 입력해 보십시오. 제 2 3 1 하면 어떻게 입력하시겠습니까?'
    await speak(STATE.prompt, 0.75);
    $('#play').disabled = false;

    const SEQUENCING_PRACTICE_1 = await waitForSubmission();

    if (SEQUENCING_PRACTICE_1 === '123') {
      await speak(/*"That's correct."*/"맞습니다", 0.75);
    } else {
      await speak(
        // 'That is not correct. I said 2 3 1, for which if sorted in numerical order, beginning with the smallest, you should have said 1 2 3.',
        '그렇지 않습니다. 제가 2 3 1 이라고 했으니까, 작은 숫자부터 순서대로 말하면 1 2 3이라고 입력해야 합니다.',
        0.75
      );
    }

    STATE.prompt = /*"Let's try another, 5 2 2."*/"또 다른 것을 해 봅시다. 5 2 2.";
    await speak(STATE.prompt, 0.75);
    $('#play').disabled = false;

    const SEQUENCING_PRACTICE_2 = await waitForSubmission();

    if (SEQUENCING_PRACTICE_2 === '225') {
      await speak(/*"That's correct. Let's do some more."*/"맞습니다. 좀 더 해봅시다.", 0.75);
    } else {
      await speak(
        // "That is not correct. I said 5 2 2, for which if sorted in numerical order, beginning with the smallest, you should have said 2 2 5. Let's do some more.",
        '그렇지 않습니다. 제가 5 2 2 라고 했으니까, 작은 숫자부터 순서대로 말하면 2 2 5 라고 입력해야 합니다.',
        0.75
      );
    }

    let sequencingWrongStreak = 0;
    SEQUENCING: for (const [i, sequence] of Object.entries(
      generate_sequencing()
    )) {
      for (const digit of sequence) {
        await speak(digit, 0.5);
      }
      const submission = await waitForSubmission();
      const isCorrect = submission === sequence.sort().join('');
      STATE.SCORE.SEQUENCING += isCorrect;
      updateTable();
      console.log({ submission, sequence: sequence.join('') });
      console.log(`SEQUENCING #${+i + 1}: ${isCorrect ? 'correct' : 'wrong'}`);

      if (isCorrect) {
        sequencingWrongStreak = 0;
      } else {
        sequencingWrongStreak++;
        if (sequencingWrongStreak === 2) {
          console.log('2 wrong answers in a row.  Ending SEQUENCING subtest.');
          break SEQUENCING;
        }
      }
    }

    $('#play').disabled = true;
    $('#submission').disabled = true;
    $('#submit-and-continue').disabled = true;

    $('#pseudo-submission').classList.add('test-complete');
  });
}

function speak(text, speed = 1, lang = 'en-US') {
  $('#play').disabled = true;
  $('#submission').disabled = true;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = $('#lang').value || 'en-US';
  utterance.rate = speed;

  utterance.addEventListener('error', ({ error }) => {
    alert(`Speech synthesis error: ${error}`);
  });

  speechSynthesis.speak(utterance);
  return new Promise((resolve) => {
    utterance.addEventListener('end', resolve);
  });
}

async function waitFor(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForSubmission() {
  $('#submission').disabled = false;
  $('#pseudo-submission').focus();
  $('#submit-and-continue').disabled = false;
  while (true) {
    await waitFor(0);
    if (STATE.submitted) {
      STATE.submitted = false;
      const submission = $('#submission').value.trim();
      $('#submission').value = '';
      return submission;
    }
  }
}

function updateTable() {
  const years = Number($('#years').value);
  for (const category of ['FORWARD', 'BACKWARD', 'SEQUENCING', 'OVERALL']) {
    const { children: tds } = $(`tr[name="${category.toLowerCase()}"]`);
    tds[1].textContent = STATE.SCORE[category];
    tds[2].textContent = STATE.SCORE.getIQ(years, category);
  }

  $('tr[name="scaled"] > td:last-child').textContent = rawToScaled(
    years,
    STATE.SCORE.OVERALL
  );
}

function rawToScaled(years, raw) {
  const key = Object.keys(SCALED_SCORES).find(key => {
    const [from, to] = key.split('-').map(Number);
    return years >= from && years <= to;
  });

  const scaledScores = SCALED_SCORES[key];
  
  const scaledScore = scaledScores.findIndex((value) => {
    const range = Array.isArray(value) ? value : [value, value];
    const [min, max] = range;
    return raw >= min && raw <= max;
  }) + 1;

  return scaledScore;
}

function setupMaskedInput() {
  setInterval(() => {
    if ($('#submission').disabled) {
      $('#pseudo-submission').innerHTML = '&nbsp;';
      $('#pseudo-submission').contentEditable = false;
    } else if ($('#pseudo-submission').contentEditable === 'false') {
      $('#pseudo-submission').contentEditable = true;
      focusContentEditable($('#pseudo-submission'));
    }
  });

  $('#pseudo-submission').addEventListener('keydown', function (evt) {
    if (evt.key === 'Enter') {
      $('#submit-and-continue').click();
      evt.preventDefault();
      return;
    }
  });

  $('#pseudo-submission').addEventListener('input', function (evt) {
    $('#submission').value = this.textContent;

    // dirty hack to flatten the tree
    this.textContent = this.textContent;

    const lastChar = document.createElement('span');

    clearTimeout(STATE.maskTimeout);

    STATE.maskTimeout = setTimeout(() => {
      lastChar.style.fontFamily = 'Password';
    }, 500);

    if (STATE.submissionValue.length < this.textContent.length) {
      lastChar.classList.add('visible-digit');
    }
    const child = this.firstChild?.splitText(this.textContent.length - 1);
    child && lastChar.appendChild(child);

    this.appendChild(lastChar);

    const range = document.createRange();
    range.selectNodeContents(this);
    range.collapse(false);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    STATE.submissionValue = this.textContent;
  });
}

function focusContentEditable(el) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.setStart(el.childNodes[0], 1);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  el.focus();
}
