import React, { useEffect, useRef, useState } from 'react';
import { Car } from '../game/Car';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const ROAD_WIDTH = 400;
const LANE_COUNT = 3;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
var car_gap = 0;
const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [winner, setWinner] = useState<string | null>(null);
  const [distance, setDistance] = useState(0);

  const p1LaneX = React.useMemo(() => {
    const offset = 50;
    return [
      offset + LANE_WIDTH / 2,
      offset + LANE_WIDTH + LANE_WIDTH / 2,
      offset + LANE_WIDTH * 2 + LANE_WIDTH / 2
    ];
  }, []);

  const p2LaneX = React.useMemo(() => {
    const offset = 450;
    return [
      offset + LANE_WIDTH / 2 + 25,
      offset + LANE_WIDTH + LANE_WIDTH / 2,
      offset + LANE_WIDTH * 2 + LANE_WIDTH / 2
    ];
  }, []);

  const player1 = useRef(new Car(p1LaneX[1], 500, '#ff4757', 'Red ', 1));
  const player2 = useRef(new Car(p2LaneX[1], 500, '#2e86de', 'Blue ', 1));
  
  const obstacles1 = useRef<Car[]>([]);
  const obstacles2 = useRef<Car[]>([]);
  
  const gameSpeed = useRef(4);
  const frameCount = useRef(0);
  const roadOffset = useRef(0);

  const startGame = () => {
    setGameState('playing');
    gameSpeed.current = 4;
    frameCount.current = 0;
    setDistance(0);
  };

  const resetGame = () => {
    player1.current = new Car(p1LaneX[1], 500, '#ff4757', 'Red Rocket', 1);
    player2.current = new Car(p2LaneX[1], 500, '#2e86de', 'Blue Bolt', 1);
    obstacles1.current = [];
    obstacles2.current = [];
    gameSpeed.current = 4;
    frameCount.current = 0;
    setDistance(0);
    setWinner(null);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      switch (e.key.toLowerCase()) {
        case 'a': 
          if (player1.current.lane > 0) player1.current.lane--; 
          break;
        case 'd': 
          if (player1.current.lane < 2) player1.current.lane++; 
          break;
        case 'arrowleft': 
          if (player2.current.lane > 0) player2.current.lane--; 
          break;
        case 'arrowright': 
          if (player2.current.lane < 2) player2.current.lane++; 
          break;
      }
      player1.current.targetX = p1LaneX[player1.current.lane];
      player2.current.targetX = p2LaneX[player2.current.lane];
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, p1LaneX, p2LaneX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const spawnObstacle = (obsList: React.MutableRefObject<Car[]>, lanes: number[]) => {
      const currentDist = Math.floor(frameCount.current / 10);
      let count = 1;
      if (currentDist >= 300) {
        count = Math.random() > 0.4 ? 2 : 1;
      } else if (currentDist >= 100) {
        count = Math.random() > 0.7 ? 2 : 1;
      }

      const availableLanes = [0, 1, 2];
      const selectedLanes: number[] = [];
      
      for(let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * availableLanes.length);
        selectedLanes.push(availableLanes.splice(index, 1)[0]);
      }

      const colors = ['#f1c40f', '#9b59b6', '#e67e22', '#16a085'];
      selectedLanes.forEach(lane => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const obs = new Car(lanes[lane], -100, color, 'NPC', lane, true);
        obs.targetX = lanes[lane];
        obsList.current.push(obs);
        if(obsList.current.length>=3){
          obsList.current.pop();
        }
      });
    };

    const render = () => {
      if (gameState !== 'playing') return;

      frameCount.current++;
      roadOffset.current = (roadOffset.current + gameSpeed.current) % 1000000000000000000;
      // difficulty limit
      if(gameSpeed.current <= 20){
      gameSpeed.current += 0.001;
    }
      
      if (frameCount.current % 10 === 0) {
        setDistance(Math.floor(frameCount.current / 10));
      }
      
      if(gameSpeed.current <=10)
        car_gap = gameSpeed.current * 4;
      else{
        car_gap = gameSpeed.current * 10;
      }
      
      // Wait 10 seconds (500 frames) before spawning
      if (frameCount.current > 500 && frameCount.current % Math.max(30, Math.floor(150 - car_gap)) === 0) {
        if (obstacles1.current.length < 10) spawnObstacle(obstacles1, p1LaneX);
        if (obstacles2.current.length < 10) spawnObstacle(obstacles2, p2LaneX);
      }

      ctx.fillStyle = '#2ed573';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const drawRoad = (x: number) => {
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(x, 0, ROAD_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.setLineDash([40, 40]);
        ctx.lineDashOffset = -roadOffset.current;
        for (let i = 1; i < LANE_COUNT; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * LANE_WIDTH, 0);
          ctx.lineTo(x + i * LANE_WIDTH, CANVAS_HEIGHT);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      };

      drawRoad(50);
      drawRoad(450);
      ctx.fillStyle = '#2ed573';
      ctx.fillRect(450, 0, 50, CANVAS_HEIGHT);

      player1.current.update();
      player2.current.update();
      player1.current.draw(ctx);
      player2.current.draw(ctx);

      const processObstacles = (obsList: React.MutableRefObject<Car[]>, player: Car, playerName: string) => {
        for (let i = obsList.current.length - 1; i >= 0; i--) {
          const obs = obsList.current[i];
          obs.y += gameSpeed.current;
          obs.draw(ctx);
          if (Math.abs(player.x - obs.x) < 30 && Math.abs(player.y - obs.y) < 60) {
            setWinner(playerName === 'Red Rocket' ? 'Blue Bolt' : 'Red Rocket');
            setGameState('end');
          }
          if (obs.y > CANVAS_HEIGHT + 100) obsList.current.splice(i, 1);
        }
      };

      processObstacles(obstacles1, player1.current, 'Red Rocket');
      processObstacles(obstacles2, player2.current, 'Blue Bolt');
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, p1LaneX, p2LaneX]);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '50px' }}>
        <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
          Distance: {distance}m
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ border: '8px solid #f1c40f', borderRadius: '20px', boxShadow: '0 0 30px rgba(0,0,0,0.7)' }} />
        {gameState === 'start' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', textAlign: 'center' }}>
            <h1 style={{ fontSize: '60px', color: '#f1c40f', margin: '0 0 20px 0', textShadow: '4px 4px 0 #000' }}>INFINITE LANE RACER</h1>
            <div style={{ display: 'flex', gap: '40px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: '#ff4757', padding: '15px', borderRadius: '10px' }}><h3>PLAYER 1</h3><p>Move: <b>A & D</b></p></div>
              <div style={{ backgroundColor: '#2e86de', padding: '15px', borderRadius: '10px' }}><h3>PLAYER 2</h3><p>Move: <b>LEFT & RIGHT</b></p></div>
            </div>
            <p style={{ fontSize: '20px', marginBottom: '20px' }}>Don't crash into other cars!</p>
            <button onClick={startGame} style={{ fontSize: '32px', padding: '15px 40px', backgroundColor: '#2ed573', border: 'none', borderRadius: '15px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 5px 0 #21a455' }}>START RACE!</button>
          </div>
        )}
        {gameState === 'end' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.9)', padding: '50px', borderRadius: '30px', textAlign: 'center', color: '#fff', border: '8px solid #f1c40f', boxShadow: '0 0 50px #f1c40f' }}>
            <h1 style={{ fontSize: '56px', margin: '0 0 20px 0' }}>{winner} Wins! 🏆</h1>
            <p style={{ fontSize: '24px', marginBottom: '30px' }}>You traveled {distance} meters!</p>
            <button onClick={resetGame} style={{ fontSize: '28px', padding: '15px 40px', backgroundColor: '#2ed573', border: 'none', borderRadius: '15px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Play Again!</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCanvas;
