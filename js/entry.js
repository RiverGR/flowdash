import { initApp } from "./app.js";

// 모듈 로드(등록/이벤트 준비)용: 실행만 시킴
import "./greeting.js";
import "./nickname.js";
import "./theme.js";
import "./add.js";
import "./filter.js";
import "./dash.js";

// 중복 부팅 방지 플래그
let scheduled = false;
let started = false;

function startOnce() {
  if (started) return;
  started = true;
  initApp();
}

// DOM 준비 후 initApp을 1회만 실행
// 이유 : 중복 이벤트를 방지하고
// 각각의 저장된 상태나 그 외 여러가지 상태가 꼬일 수 있기 때문에 그것을 방지하는 역할이다.
export function ensureBoot() {
  if (scheduled) return;
  scheduled = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startOnce, { once: true });
  } else {
    queueMicrotask(startOnce);
  }
}

// 엔트리로 로드되면 자동 부팅
ensureBoot();
