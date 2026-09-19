$(function () {
  const $slider = $('#length');
  const $lengthVal = $('#length-val');
  const $form = $('.form-password');
  const $uppercase = $('input[name=uppercase]');
  const $lowercase = $('input[name=lowercase]');
  const $numbers = $('input[name=numbers]');
  const $symbols = $('input[name=symbols]');
  const $copied = $('.password-copy');
  let copyTimer;
  let copyRequest = 0;

  function updateSliderBackground(e) {
    const $target = e ? $(e.currentTarget) : $slider;
    const value = Number($target.val());
    const min = Number($target.attr('min') ?? 0);
    const max = Number($target.attr('max') ?? 100);

    // 현재 값이 몇 % 위치인지 계산
    const percentage = ((value - min) / (max - min)) * 100;

    // input 요소에 직접 CSS 변수(--progress)를 꽂아줌
    $target.css('--progress', `${percentage}%`);

    // (선택) 숫자를 실시간으로 변경해주기
    $lengthVal.text(value);
  }

  // 1. 처음 로딩될 때 슬라이더 배경색 1번 세팅
  updateSliderBackground();

  // 2. 마우스로 드래그할 때마다 실시간으로 함수 실행
  $slider.on('input', updateSliderBackground);

  $form.on('submit', function (event) {
    // 1. 브라우저의 기본 폼 제출 동작(페이지 새로고침)을 차단합니다.
    event.preventDefault();

    const groups = [];
    if ($uppercase.prop('checked')) groups.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if ($lowercase.prop('checked')) groups.push('abcdefghijklmnopqrstuvwxyz');
    if ($numbers.prop('checked')) groups.push('0123456789');
    if ($symbols.prop('checked')) groups.push('!@#$%^&*()_+~`|}{[]:;?><,./-=');

    const length = Number($slider.val());
    if (!Number.isInteger(length) || length < 1) {
      alert('암호 길이는 1 이상이어야 합니다.');
      return;
    }
    if (groups.length === 0) {
      // 아무 옵션도 선택하지 않으면 소문자만 사용합니다.
      groups.push('abcdefghijklmnopqrstuvwxyz');
    }
    if (length < groups.length) {
      alert(
        `암호 길이는 선택한 문자 종류 수(${groups.length}) 이상이어야 합니다.`,
      );
      return;
    }

    const password = generatePassword(length, groups);
    $('.password').text(password).addClass('active');
    updateStrength(password);
    copyRequest++;
    clearTimeout(copyTimer);
    $('.copied').removeClass('active');
  });

  $copied.on('click', async function () {
    const $password = $('.password');
    if (!$password.hasClass('active') || !$password.text()) {
      alert('먼저 암호를 생성해 주세요.');
      return;
    }

    const request = ++copyRequest;
    clearTimeout(copyTimer);
    $('.copied').removeClass('active');
    try {
      await navigator.clipboard.writeText($password.text());
      // 복사 대기 중 새 암호 생성 또는 재클릭 시 이전 결과를 표시하지 않습니다.
      if (request !== copyRequest) return;
      $('.copied').addClass('active');
      copyTimer = setTimeout(() => $('.copied').removeClass('active'), 2000);
    } catch {
      if (request !== copyRequest) return;
      alert('클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.');
    }
  });

  // UI 표시용 단계이며 실제 공격에 대한 안전성을 보증하는 점수는 아닙니다.
  function updateStrength(password) {
    const types = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(
      (pattern) => pattern.test(password),
    ).length;
    let level = 0;
    if (password.length >= 16 && types === 4) level = 3;
    else if (password.length >= 12 && types >= 3) level = 2;
    else if (password.length >= 8 && types >= 2) level = 1;

    const labels = ['TOO WEAK!', 'WEAK', 'MEDIUM', 'STRONG'];
    const colors = ['bg-red', 'bg-orange', 'bg-yello', 'bg-green'];
    $('.strength-value').text(labels[level]);
    $('.strength .box-strength')
      .removeClass('active bg-red bg-orange bg-yello bg-green')
      .slice(0, level + 1)
      .addClass(colors[level]);
  }

  // 나머지 연산의 편향을 피하면서 암호학적 난수로 인덱스를 선택합니다.
  function randomIndex(max) {
    const range = 2 ** 32;
    const limit = range - (range % max);
    const values = new Uint32Array(1);
    do {
      crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % max;
  }

  function generatePassword(length, groups) {
    const chars = groups.join('');
    // 선택한 종류마다 최소 한 글자를 포함합니다.
    const password = groups.map((group) => group[randomIndex(group.length)]);
    while (password.length < length) {
      password.push(chars[randomIndex(chars.length)]);
    }

    // 필수 문자의 위치가 고정되지 않도록 Fisher–Yates 방식으로 섞습니다.
    for (let i = password.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
  }
});
