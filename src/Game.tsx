"use client";

import { useEffect, useState } from "react";

type Point = { x: number; y: number };
type Unit = Point & {
  id: string;
  name: string;
  captain: string;
  hp: number;
  target: Point;
  glyph: string;
};
type Enemy = Point & { id: string; name: string; hp: number; glyph: string };
type Phase = "briefing" | "running" | "paused" | "won" | "lost";
type Game = {
  phase: Phase;
  units: Unit[];
  enemies: Enemy[];
  tower: number;
  fortress: number;
  morale: number;
  elapsed: number;
  message: string;
};

const TOWER = { x: 46, y: 49 };
const FORTRESS = { x: 79, y: 25 };
const START: Game = {
  phase: "briefing",
  units: [
    { id: "lark", name: "苍鹭队", captain: "璃鸢", x: 22, y: 73, hp: 100, target: { x: 22, y: 73 }, glyph: "♞" },
    { id: "oak", name: "磐木队", captain: "霍恩", x: 16, y: 81, hp: 100, target: { x: 16, y: 81 }, glyph: "◆" },
  ],
  enemies: [
    { id: "wolf", name: "黑狼斥候", x: 59, y: 43, hp: 100, glyph: "♠" },
    { id: "thorn", name: "王庭枪阵", x: 72, y: 30, hp: 100, glyph: "✦" },
  ],
  tower: 0,
  fortress: 0,
  morale: 3,
  elapsed: 0,
  message: "先夺回白烽塔，再向黑棘堡进军。",
};

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
function moveToward(from: Point, to: Point, speed: number): Point {
  const d = distance(from, to);
  if (d <= speed) return to;
  return { x: from.x + ((to.x - from.x) / d) * speed, y: from.y + ((to.y - from.y) / d) * speed };
}

if (process.env.NODE_ENV === "development") {
  console.assert(moveToward({ x: 0, y: 0 }, { x: 3, y: 4 }, 1).y === 0.8, "movement rule");
}

function tick(previous: Game): Game {
  if (previous.phase !== "running") return previous;
  const units = previous.units.map((unit) => ({ ...unit, ...moveToward(unit, unit.target, 0.28) }));
  const enemies = previous.enemies.map((enemy) => ({
    ...enemy,
    ...(enemy.hp > 0 ? moveToward(enemy, previous.tower >= 100 ? FORTRESS : TOWER, 0.055) : {}),
  }));
  let message = previous.message;
  let morale = previous.morale;

  for (const unit of units) {
    if (unit.hp <= 0) continue;
    const foe = enemies.filter((enemy) => enemy.hp > 0).sort((a, b) => distance(unit, a) - distance(unit, b))[0];
    if (foe && distance(unit, foe) < 4.6) {
      unit.hp = Math.max(0, unit.hp - 0.52);
      foe.hp = Math.max(0, foe.hp - 1.25);
      message = foe.hp ? `${unit.name} 与${foe.name}交锋！` : `${foe.name}溃退，士气上升。`;
      if (!foe.hp) morale = Math.min(9, morale + 1);
    }
  }

  const livingUnits = units.filter((unit) => unit.hp > 0);
  const towerAllies = livingUnits.filter((unit) => distance(unit, TOWER) < 6).length;
  const towerEnemies = enemies.filter((enemy) => enemy.hp > 0 && distance(enemy, TOWER) < 6).length;
  let tower = previous.tower;
  if (towerAllies > towerEnemies) tower = Math.min(100, tower + 0.9 * towerAllies);
  if (tower >= 100 && previous.tower < 100) message = "白烽塔已解放！黑棘堡进军路线开放。";

  const atFortress = tower >= 100 ? livingUnits.filter((unit) => distance(unit, FORTRESS) < 7).length : 0;
  const fortressEnemies = enemies.filter((enemy) => enemy.hp > 0 && distance(enemy, FORTRESS) < 8).length;
  let fortress = previous.fortress;
  if (atFortress > fortressEnemies) fortress = Math.min(100, fortress + 0.75 * atFortress);

  const phase = livingUnits.length === 0 ? "lost" : fortress >= 100 ? "won" : previous.phase;
  return { ...previous, units, enemies, tower, fortress, morale, message, phase, elapsed: previous.elapsed + 0.12 };
}

function formatTime(seconds: number) {
  const value = Math.max(0, 240 - Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export default function Home() {
  const [game, setGame] = useState<Game>(START);
  const [selected, setSelected] = useState("lark");
  const active = game.units.find((unit) => unit.id === selected) ?? game.units[0];

  useEffect(() => {
    if (game.phase !== "running") return;
    const timer = window.setInterval(() => setGame(tick), 120);
    return () => window.clearInterval(timer);
  }, [game.phase]);

  const order = (target: Point, text: string, all = false) => {
    setGame((state) => ({
      ...state,
      message: text,
      units: state.units.map((unit) => (all || unit.id === selected ? { ...unit, target } : unit)),
    }));
  };

  const mapOrder = (event: React.MouseEvent<HTMLElement>) => {
    if (game.phase === "briefing") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const target = { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
    order(target, `${active.name}收到移动指令。`);
  };

  const reset = () => {
    setSelected("lark");
    setGame(START);
  };

  return (
    <main className="game-shell">
      <section className="battlefield" aria-label="暮钟谷战术地图" onClick={mapOrder}>
        <div className="sun-glow" />
        <div className="mist mist-one" />
        <div className="mist mist-two" />

        <header className="topbar" onClick={(event) => event.stopPropagation()}>
          <div className="mission-mark"><span>作战</span><b>暮钟谷解放战</b></div>
          <div className="objective"><small>胜利条件</small><strong>占领黑棘堡</strong></div>
          <div className="battle-clock"><small>余时</small><b>{formatTime(game.elapsed)}</b></div>
          <div className="morale"><small>勇气</small><b>{"✦".repeat(game.morale)}</b></div>
        </header>

        <aside className="squad-panel" onClick={(event) => event.stopPropagation()}>
          <div className="panel-title"><span>PLAYER UNIT</span><b>出阵小队</b></div>
          {game.units.map((unit) => (
            <button key={unit.id} className={`squad-card ${selected === unit.id ? "selected" : ""}`} onClick={() => setSelected(unit.id)}>
              <span className="portrait">{unit.glyph}</span>
              <span className="squad-copy"><b>{unit.name}</b><small>队长 · {unit.captain}</small><i><em style={{ width: `${unit.hp}%` }} /></i></span>
              <strong>{Math.ceil(unit.hp)}</strong>
            </button>
          ))}
          <div className="formation">
            <span className="slot front">盾</span><span className="slot">枪</span><span className="slot back">弓</span><span className="slot back">术</span>
          </div>
          <div className="tactics"><span>战术优先</span><b>① 残血敌军</b><b>② 前排重甲</b></div>
        </aside>

        <div className="map-label tower-label" style={{ left: `${TOWER.x}%`, top: `${TOWER.y - 8}%` }}><b>白烽塔</b><span>{Math.floor(game.tower)}%</span></div>
        <button className={`stronghold tower ${game.tower >= 100 ? "liberated" : ""}`} style={{ left: `${TOWER.x}%`, top: `${TOWER.y}%` }} onClick={(event) => { event.stopPropagation(); order(TOWER, `${active.name}向白烽塔进军。`); }} aria-label="向白烽塔移动">♜</button>
        <div className="map-label fort-label" style={{ left: `${FORTRESS.x}%`, top: `${FORTRESS.y - 8}%` }}><b>黑棘堡</b><span>{Math.floor(game.fortress)}%</span></div>
        <button className="stronghold fortress" style={{ left: `${FORTRESS.x}%`, top: `${FORTRESS.y}%` }} disabled={game.tower < 100} onClick={(event) => { event.stopPropagation(); order(FORTRESS, `${active.name}向黑棘堡发动总攻！`); }} aria-label="向黑棘堡移动">♛</button>

        {game.enemies.filter((enemy) => enemy.hp > 0).map((enemy) => (
          <button key={enemy.id} className="unit-token enemy" style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }} onClick={(event) => { event.stopPropagation(); order({ x: enemy.x, y: enemy.y }, `${active.name}锁定${enemy.name}。`); }}>
            <span>{enemy.glyph}</span><b>{enemy.name}</b><i><em style={{ width: `${enemy.hp}%` }} /></i>
          </button>
        ))}
        {game.units.filter((unit) => unit.hp > 0).map((unit) => (
          <button key={unit.id} className={`unit-token ally ${selected === unit.id ? "active" : ""}`} style={{ left: `${unit.x}%`, top: `${unit.y}%` }} onClick={(event) => { event.stopPropagation(); setSelected(unit.id); }}>
            <span>{unit.glyph}</span><b>{unit.name}</b><i><em style={{ width: `${unit.hp}%` }} /></i>
          </button>
        ))}

        <div className="orders" onClick={(event) => event.stopPropagation()}>
          <p><span className="seal">令</span>{game.message}</p>
          <div>
            <button onClick={() => order(TOWER, "全军向白烽塔集结。", true)}>全军集结</button>
            <button disabled={game.tower < 100} onClick={() => order(FORTRESS, "全军向黑棘堡发动总攻！", true)}>进军敌堡</button>
            <button className="play" onClick={() => setGame((state) => ({ ...state, phase: state.phase === "running" ? "paused" : "running" }))}>{game.phase === "running" ? "Ⅱ 暂停" : "▶ 继续"}</button>
          </div>
        </div>

        {game.phase === "briefing" && (
          <div className="curtain" onClick={(event) => event.stopPropagation()}>
            <div className="chapter"><small>CHAPTER I · 反旗初举</small><h1>苍烬盟誓</h1><i /><p>暮钟谷 · 解放作战</p><button onClick={() => setGame((state) => ({ ...state, phase: "running" }))}>举旗出阵</button><span>点击地图下达移动指令</span></div>
          </div>
        )}
        {(game.phase === "won" || game.phase === "lost") && (
          <div className="curtain result" onClick={(event) => event.stopPropagation()}>
            <div className="chapter"><small>{game.phase === "won" ? "LIBERATION COMPLETE" : "FORCES DEFEATED"}</small><h1>{game.phase === "won" ? "解放" : "败北"}</h1><i /><p>{game.phase === "won" ? "黑棘堡的王旗已然坠落" : "重整编队，再度举旗"}</p><button onClick={reset}>再次出阵</button></div>
          </div>
        )}
      </section>
    </main>
  );
}
