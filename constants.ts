
import { TarotCard, MoonPhase, DayEntry } from './types';
import { calculateMoonPhase } from './utils/uiHelpers';

// Using public domain Rider-Waite Tarot images from Wikimedia Commons
export const TAROT_DECK: TarotCard[] = [
  { 
    id: 'c0', 
    name: '愚人 (The Fool)', 
    keywords: ['新的开始', '天真', '自发性'], 
    meaning: '向未知迈出信念的一跃，保持纯真与开放。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg' 
  },
  { 
    id: 'c1', 
    name: '魔术师 (The Magician)', 
    keywords: ['显化', '力量', '行动'], 
    meaning: '你拥有实现目标所需的一切资源与天赋。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg' 
  },
  { 
    id: 'c2', 
    name: '女祭司 (The High Priestess)', 
    keywords: ['直觉', '神秘', '潜意识'], 
    meaning: '向内探索，倾听你内在最深处的声音。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg' 
  },
  { 
    id: 'c3', 
    name: '皇后 (The Empress)', 
    keywords: ['富足', '滋养', '自然'], 
    meaning: '创造力正在流淌，拥抱生活中的美与丰盛。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg' 
  },
  { 
    id: 'c4', 
    name: '皇帝 (The Emperor)', 
    keywords: ['权威', '结构', '稳固'], 
    meaning: '建立秩序与规则，为你的生活带来结构。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg' 
  },
  { 
    id: 'c5', 
    name: '教皇 (The Hierophant)', 
    keywords: ['传统', '信仰', '学习'], 
    meaning: '寻求智慧的指引，尊重传统或精神教导。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg' 
  },
  { 
    id: 'c9', 
    name: '隐士 (The Hermit)', 
    keywords: ['内省', '独处', '指引'], 
    meaning: '暂时撤退，在孤独中寻找内心的光。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg' 
  },
  { 
    id: 'c17', 
    name: '星星 (The Star)', 
    keywords: ['希望', '灵感', '宁静'], 
    meaning: '在黑暗之后，希望之光重新闪耀。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg' 
  },
  { 
    id: 'c18', 
    name: '月亮 (The Moon)', 
    keywords: ['幻觉', '潜意识', '不安'], 
    meaning: '在迷雾中前行，直面内心的恐惧与直觉。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg' 
  },
  { 
    id: 'c19', 
    name: '太阳 (The Sun)', 
    keywords: ['快乐', '成功', '活力'], 
    meaning: '纯粹的喜悦与清晰，一切都在阳光下显现。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg' 
  },
  { 
    id: 'c20', 
    name: '审判 (Judgement)', 
    keywords: ['觉醒', '重生', '召唤'], 
    meaning: '响应内心的召唤，通过反思获得新生。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg' 
  },
  { 
    id: 'c21', 
    name: '世界 (The World)', 
    keywords: ['完成', '整合', '圆满'], 
    meaning: '一个周期的结束，享受圆满与成就。', 
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg' 
  }
];

export const MOON_PHASE_INFO = {
  [MoonPhase.NEW]: {
    cnName: '新月',
    blessing: '在黑暗中播种，万物皆有可能。',
    tip: '适合开启新计划、设定意图，避免过度消耗。',
    keywords: '潜能 · 直觉 · 播种',
    physics: '此时月球运行到地球和太阳之间，且三者大致在一条直线上。月球的背光面朝向地球，因此我们在天空中几乎看不见它。此时太阳和月亮的引力叠加，对地球的潮汐引力最强。',
    archetype: '新月象征着纯粹的潜能与“空”。作为新月人，你拥有孩童般纯真与冲动的原始力量。你是一个天生的发起者，比起深思熟虑，你更相信直觉的指引。虽然有时会显得莽撞，但这正是你打破旧秩序、创造新事物的力量来源。'
  },
  [MoonPhase.WAXING_CRESCENT]: {
    cnName: '眉月',
    blessing: '微光初现，希望正在萌芽。',
    tip: '收集信息，为你的计划注入第一波行动力。',
    keywords: '好奇 · 探索 · 萌芽',
    physics: '随着月球继续公转，它从新月位置向东移动。我们在傍晚的西方天空中能看到一弯细细的蛾眉月。虽然光亮微弱，但它标志着光明的回归。',
    archetype: '眉月象征着最初的成长意愿。作为眉月人，你是一个充满好奇心的探索者。你可能经常感到一种想要“冲破束缚”的内在张力。你渴望独立，热衷于收集信息和体验，虽然仍在试探中前行，但你的坚持会让微光最终汇聚成火炬。'
  },
  [MoonPhase.FIRST_QUARTER]: {
    cnName: '上弦月',
    blessing: '在张力中寻找平衡与突破。',
    tip: '可能会遇到挑战，这是宇宙在测试你的决心。',
    keywords: '行动 · 决断 · 建立',
    physics: '月球运行到太阳以东90度。此时我们能看到月球被照亮的右半部分。这是一个光影各半的时刻，象征着一种临界点。',
    archetype: '上弦月象征着“行动的危机”。作为上弦月人，你天生具有一种紧迫感和建设性。你擅长在混乱中建立秩序，是一个天生的战士和建设者。你的人生课题往往关于如何处理内在的冲突，并将其转化为推动现实改变的强大动力。'
  },
  [MoonPhase.WAXING_GIBBOUS]: {
    cnName: '盈凸月',
    blessing: '能量充盈，接近圆满。',
    tip: '微调你的方向，在此刻全力以赴。',
    keywords: '精进 · 分析 · 完善',
    physics: '月球继续运行，大部分被照亮，仅左边缘有些许阴影。月亮即将迎来它的全盛时刻，光芒日益强烈。',
    archetype: '盈凸月象征着“完美的追求”。作为盈凸月人，你拥有敏锐的分析能力和追求卓越的渴望。你不仅仅满足于做完，更追求做好。你的灵魂渴望通过不断的自我完善和微调，为最终的“圆满”做好准备。小心不要陷入过度的自我批判。'
  },
  [MoonPhase.FULL]: {
    cnName: '满月',
    blessing: '光芒万丈，看见真实的自我。',
    tip: '情绪可能高涨，适合进行满月释放仪式，感恩收获。',
    keywords: '圆满 · 照见 · 关系',
    physics: '地球位于太阳和月球之间，月球被照亮的半球完全朝向地球。这是一月中月亮最圆、最亮的时刻，引力潮汐再次达到高峰。',
    archetype: '满月象征着“客观的照见”。作为满月人，你拥有清晰的觉知力和充沛的情感。你对他人的情绪非常敏感，是一个天生的关系处理者。你的人生课题在于如何在“自我”与“他人”之间找到平衡，不迷失在外界的投射中，发散出属于你自己的光。'
  },
  [MoonPhase.WANING_GIBBOUS]: {
    cnName: '亏凸月',
    blessing: '分享智慧，回馈世界。',
    tip: '开始整理与回顾，将学到的经验分享给他人。',
    keywords: '回馈 · 传播 · 智慧',
    physics: '满月过后，月球开始“亏缺”。光亮面开始从右侧缩减，但整体依然明亮。这是一个能量开始从外向内转化的过程。',
    archetype: '亏凸月象征着“智慧的传播”。作为亏凸月人，你是一个天生的导师或传播者。你热衷于将个人的经验转化为普世的智慧，并分享给他人。你拥有独特的社会责任感，渴望回馈所在的社群。你的力量在于连接与启发。'
  },
  [MoonPhase.LAST_QUARTER]: {
    cnName: '下弦月',
    blessing: '释放不再服务于你的事物。',
    tip: '断舍离的最佳时机，放下包袱，为下一次循环做准备。',
    keywords: '释放 · 修正 · 独立',
    physics: '月球运行到太阳以西90度。此时我们只能看到月球被照亮的左半部分。与上弦月相反，这是一个关于“收缩”和“修正”的时刻。',
    archetype: '下弦月象征着“意识的修正”。作为下弦月人，你拥有断舍离的勇气和独立的精神。你擅长反思，敢于打破不再服务于你的旧有模式。你可能看起来有些叛逆或特立独行，但那是因为你正在为新的周期清理空间。你的力量在于重塑。'
  },
  [MoonPhase.WANING_CRESCENT]: {
    cnName: '残月',
    blessing: '在静谧中休养生息，回归虚空。',
    tip: '深度休息，进行冥想，清理身心空间。',
    keywords: '沉淀 · 灵性 · 终结',
    physics: '月球即将再次回到新月位置，只剩下一弯细细的残月出现在黎明的东方。光芒即将消失，一切回归黑暗。',
    archetype: '残月象征着“周期的终结”与“灵性的提取”。作为残月人，你拥有极强的直觉和老灵魂般的深沉。你倾向于内省，对物质世界可能稍显疏离，但对精神世界有着天然的连接。你的课题是学会放手，并在虚空中安住，等待下一次重生。'
  }
};

// Helper to get today's date string YYYY-MM-DD
// Returns ACTUAL system date
export const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Dynamic Mock History
const getRelativeDateStr = (offset: number) => {
    // Base date: Current Real Date
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Helper to get phase for mock data
const getPhaseForDate = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    return calculateMoonPhase(new Date(parts[0], parts[1] - 1, parts[2]));
};

const dateYesterday = getRelativeDateStr(-1);
const dateBeforeYesterday = getRelativeDateStr(-2);

// Initial Mock Data
export const MOCK_HISTORY: DayEntry[] = [
  // Today is usually empty initially for the app flow
  
  // Yesterday (offset -1)
  {
    date: dateYesterday,
    moonPhase: getPhaseForDate(dateYesterday),
    todayAwareness: { cardId: 'c18', chatHistory: [], complexityScore: 85, status: 'done', selectedTitle: '直觉指引' },
    tomorrowSeed: { cardId: 'c19', blessingCompleted: true, energySeed: '拥抱变化', aiSuggestion: '为新年做准备。', status: 'done' }
  },
  // Day before yesterday (offset -2)
  {
    date: dateBeforeYesterday,
    moonPhase: getPhaseForDate(dateBeforeYesterday),
    todayAwareness: { cardId: 'c9', chatHistory: [], complexityScore: 30, status: 'done', selectedTitle: '回归宁静' },
    tomorrowSeed: { cardId: 'c17', blessingCompleted: true, energySeed: '早睡一小时', aiSuggestion: '', status: 'done' }
  }
];

// SENSORY CALIBRATION DATABASE
export const SENSORY_TASKS = {
    visual: [
        "找到一个边缘不是直线的影子。",
        "找到一个比周围更亮的区域。",
        "找到一个由两个颜色叠在一起形成的部分。",
        "找到一个光线在表面发生反射的地方。",
        "找到一个颜色最深的小区域。",
        "找到一个被光照到但不完全清晰的物体。",
        "找到一个形状不规则的轮廓。",
        "找到一个你平时不会注视的角落。",
        "找到一个看起来很轻的物体。",
        "找到一个光线正在变化的位置。"
    ],
    audio: [
        "找到一个持续存在的背景声音。",
        "找到一个突然出现的声音。",
        "找到一个声音来源不明确的声响。",
        "找到一个离你最近的声音。",
        "找到一个来自远处的声音。",
        "找到一个节奏重复的声音。",
        "找到一个声音很轻但能被分辨的声源。",
        "找到一个不是电子设备发出的声音。",
        "找到一个你平时会忽略的声音。",
        "找到一个声音消失的瞬间。"
    ],
    touch: [
        "触摸一个比你手掌温度低的物体。",
        "触摸一个表面不平整的物体。",
        "触摸一个柔软但有支撑感的东西。",
        "感受身体与椅子或地面的接触点。",
        "用指尖触摸一个边缘清晰的物体。",
        "感受衣物与皮肤接触的位置。",
        "用手掌感受空气的流动。",
        "触摸一个你每天都会碰到的物品。",
        "感受脚底与地面的接触。",
        "触摸一个让你立刻注意到触感的表面。"
    ],
    smell: [
        "闻一闻你所在空间的空气。",
        "闻一闻一个靠近你的位置。",
        "闻一闻一个物体表面的气味。",
        "深吸一口气，注意第一种感觉。",
        "闻一闻靠近窗户或门口的空气。",
        "找到一种比较淡的气味。",
        "闻一闻衣物或书本的味道。",
        "闻一闻你刚刚接触过的物品。",
        "找到一种停留时间很短的气味。",
        "闻一闻空气中是否有变化。"
    ],
    taste: [
        "喝一口水，注意它在口中的温度。",
        "把水含在口中一秒，感受舌头的触感。",
        "注意水接触舌头时的感觉。",
        "感受吞咽时喉咙的动作。",
        "留意口腔中此刻是否有味道。",
        "感受水在口腔中的流动方向。",
        "注意水在口中停留时的触感。",
        "感受水离开口腔时的瞬间。",
        "留意口腔在吞咽后的感觉。",
        "喝水后，注意身体的即时反应。"
    ]
};
