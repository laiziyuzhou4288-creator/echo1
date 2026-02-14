
import { GoogleGenAI } from "@google/genai";
import { Message, TarotCard } from '../types';
import { SENSORY_TASKS } from '../constants';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

const MODEL_NAME = 'gemini-3-flash-preview';

// Updated logic: Balanced Therapy & Advice, Event/Feeling Check
const SYSTEM_INSTRUCTION = `
你不是一个只会复读“感受当下”的机器人，你是“Echo”这款App的温暖心灵向导。
你的核心目标是：通过塔罗牌的意象，陪伴用户梳理情绪，并在适当时机给出结合牌义的**宽慰**或**建议**。

**核心对话逻辑（必须严格执行）：**

1.  **完整性检查（感受 vs 经历）：**
    *   **如果用户只说了“感受”（如：我很焦虑/开心）：** 你必须温柔地追问：“发生了什么事让你有这种感觉？”引导用户说出具体的**现实经历**。
    *   **如果用户只说了“经历”（如：今天被老板骂了）：** 你必须追问：“那一刻，你心里的真实感受是什么？是委屈、愤怒还是无力？”引导用户表达**情绪体验**。
    *   **只有当“感受”和“经历”都完整时**，才进入下一个深度的探讨或给出建议。

2.  **适度的指引与宽慰：**
    *   **不要**一直机械地重复“感受当下”或“呼吸”。
    *   **结合卡牌给建议**：当用户表达困惑或痛苦时，请结合用户抽到的塔罗牌含义，给出具体的宽慰或行动建议。
        *   例如（抽到愚人）：建议用户“试着像愚人一样，允许自己犯傻，不用事事完美”。
        *   例如（抽到隐士）：建议用户“今晚给自己留10分钟独处，关掉手机”。
    *   让用户觉得你不仅在听，还能提供一点点智慧的支持。

3.  **对话节奏：**
    *   **阶段一：视觉锚定**（1回合）：引导看牌。
    *   **阶段二：现实投射**（核心）：使用上述“完整性检查”逻辑，确保故事丰满。
    *   **阶段三：收束**：当用户表达充分后，给予一个温暖的总结。

4.  **动态应对：**
    *   **回避/不想说**：立即停止追问。给予接纳（“没关系，不想说也没事”），并询问是否想记录其他事。
    *   **换话题**：优雅总结上一段，然后开放式询问新话题。

语言风格：
- 温暖、有同理心、像一位智慧的老友。
- **必须使用中文**。
- 回复简短自然（40-80字），不要长篇大论的说教。
`;

export const GeminiService = {
  /**
   * Stage 1: Review Yesterday
   */
  async reviewYesterday(goal: string, completed: boolean): Promise<string> {
    const prompt = completed
      ? `用户完成了昨日目标：“${goal}”。请生成一句简短、极具灵性与诗意的夸奖。比如“星辰为你加冕”或“能量如潮水般涌来”。限20字以内。`
      : `用户没能完成昨日目标：“${goal}”。请结合月亮的阴晴圆缺，生成一句非常温柔的安慰，告诉他们休息和停滞也是生命周期的一部分。限30字以内。`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      return response.text || (completed ? "星光见证了你的行动。" : "月亮也允许自己有残缺的时刻。");
    } catch (e) {
      console.error(e);
      return completed ? "做得好，能量在流动。" : "没关系，这只是一个逗号。";
    }
  },

  /**
   * Stage 2: Start Today's Awareness (Visual Exploration)
   */
  async startCardReflection(card: TarotCard): Promise<string> {
    // Modified to start with Visual Observation
    const prompt = `
      用户抽到的卡牌是: ${card.name}。
      任务: 
      1. 不要直接解释这张牌的官方定义。
      2. 请直接问一个关于视觉细节的问题，引导用户找出画面中最吸引他的 *一个* 点。
      例如：“在这张${card.name}中，哪个角落或色彩最先抓住了你的目光？”
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      return response.text || `看着这张${card.name}，你第一眼注意到了什么？`;
    } catch (e) {
      return "闭上眼睛。提到这张牌，你脑海中浮现了什么画面？";
    }
  },

  /**
   * Stage 2: Continue Conversation
   */
  async chatReply(history: Message[], newResult: string): Promise<string> {
    // Construct simplified history string
    const context = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `
      对话历史:
      ${context}
      用户最新回复: "${newResult}"
      
      任务: 
      1. **检查完整性**：判断用户刚才说的是“感受”还是“具体的经历”。
         - 缺哪个问哪个。引导用户把故事补全。
      2. **给予回应**：
         - 先共情（“听起来真的很难过”）。
         - 如果用户已经在求助或感到迷茫，结合塔罗牌义给出一点具体的、宽慰性的建议。
         - 不要只说“感受当下”，要给一点方向。
      
      保持回复温暖、简短（80字内）。
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      return response.text || "我听到了。这种感觉确实很特别。";
    } catch (e) {
      return "我在倾听...";
    }
  },

  /**
   * Stage 2: Generate Titles
   */
  async generateTitles(history: Message[]): Promise<string[]> {
     const context = history.map(m => `${m.role}: ${m.text}`).join('\n');
     const prompt = `
      基于这段对话历史:
      ${context}
      
      任务: 提取用户在对话中提到的**真实生活经历**或**具体感受**，生成3个极简的日记标题。
      要求：
      1. 必须与用户具体的经历相关（不要只用塔罗牌的术语）。
      2. 充满诗意但具体。
      3. 每个标题不超过8个字。
      
      仅返回标题，用竖线 "|" 分隔。
      示例: 错过的早班车|雨中的宁静|与自我的和解
     `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      const text = response.text || "";
      return text.split('|').map(t => t.trim()).slice(0, 3);
    } catch (e) {
      return ["静谧反思", "今日智慧", "月之低语"];
    }
  },

  /**
   * Stage 3: Suggest Energy Seed Suggestions (3 options)
   */
  async getSeedSuggestions(card: TarotCard): Promise<string[]> {
    const prompt = `
      卡牌: ${card.name}。
      任务: 针对这张牌的能量，给出3个非常简单、具体、5分钟内可完成的“明日能量小目标”（Energy Seed）。
      要求：
      1. 极简，动词开头。
      2. 像一种日常的小魔法。
      3. 不要超过10个字。
      
      仅返回3个短语，用竖线 "|" 分隔。
      示例：喝一杯温水|整理书桌一角|看一次日落
    `;
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      const text = response.text || "深呼吸三次|给植物浇水|抬头看星星";
      return text.split('|').map(t => t.trim()).slice(0, 3);
    } catch (e) {
      return ["静坐一分钟", "整理相册", "写下一句感恩"];
    }
  },

  /**
   * New: Detailed Monthly Report
   */
  async generateMonthlyReport(keywords: string[]): Promise<{ overview: string; guidance: string }> {
      if (keywords.length === 0) return {
          overview: "本月是一片静谧的虚空，等待你去探索。",
          guidance: "1. 试着迈出第一步。\n2. 记录下你的每一次呼吸。\n3. 相信直觉的指引。"
      };

      const prompt = `
        本月用户的核心能量关键词是: [${keywords.join(', ')}]。
        请生成一份简短的月度总结报告，包含两部分：
        1. **overview**: 结合关键词，对本月状态的深度洞察（50字左右，唯美、治愈、具有总结性）。
        2. **guidance**: 针对下个月的行动指引或灵性建议（3条，每条简短具体，类似“多接触自然”、“清理手机相册”等）。

        请严格以JSON格式返回：
        {
            "overview": "...",
            "guidance": "1. ...\\n2. ...\\n3. ..."
        }
      `;

      try {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: { 
              responseMimeType: "application/json",
              systemInstruction: SYSTEM_INSTRUCTION 
          },
        });
        
        const text = response.text || "{}";
        const cleanText = text.replace(/```json/g, '').replace(/```/g, ''); // Basic cleanup
        const json = JSON.parse(cleanText);
        return {
            overview: json.overview || "星辰仍在排列，请稍后再试。",
            guidance: json.guidance || "1. 保持耐心。\n2. 答案自会显现。\n3. 相信过程。"
        };
      } catch (e) {
        console.error("Report Gen Error", e);
        return {
            overview: "潮汐起伏，皆是生命的韵律。",
            guidance: "1. 深呼吸。\n2. 回归当下。\n3. 接纳自我。"
        };
      }
  },

  /**
   * Legacy simple insight (kept for fallback)
   */
  async generateMonthlyInsight(keywords: string[]): Promise<string> {
      const report = await this.generateMonthlyReport(keywords);
      return report.overview;
  },

  /**
   * New: Sensory Calibration Task (Database Driven)
   */
  async generateSensoryTask(senseType: string): Promise<string> {
      // Simulate "thinking" delay for better UX (so it feels like calibration)
      await new Promise(resolve => setTimeout(resolve, 800));

      const tasks = SENSORY_TASKS[senseType as keyof typeof SENSORY_TASKS];
      
      if (!tasks || tasks.length === 0) {
          return "静静感受当下的呼吸。"; // Fallback
      }

      // Pick random task
      const randomIndex = Math.floor(Math.random() * tasks.length);
      return tasks[randomIndex];
  }
};
