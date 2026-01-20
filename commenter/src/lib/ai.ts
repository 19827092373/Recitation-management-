import { ApiConfig, Student, StudentRank, DEFAULT_PROMPT_TEMPLATE } from '../types/index';

// 简单的成绩档位描述（不包含写作策略，让AI自由发挥）
const RANK_LABELS: Record<StudentRank, string> = {
  TOP: '成绩优异',
  HIGH: '成绩良好',
  MIDDLE: '成绩中等',
  LOW: '成绩待提高',
  NEEDS_SUPPORT: '需要更多关注'
};

export async function generateBatchComments(students: Student[], config: ApiConfig): Promise<Record<string, string>> {
  const { baseUrl, apiKey, model, customProjects = [] } = config;

  if (!apiKey) {
    throw new Error('请先在配置中输入 API Key');
  }

  const batchRequests = students.map(s => {
    let template = config.promptTemplate || DEFAULT_PROMPT_TEMPLATE;

    const genderStr = s.gender === 'MALE' ? '男' : '女';
    const rankLabel = RANK_LABELS[s.rank];
    const traitsStr = s.traits.join('、') || '暂无特别标注';

    const projectList = s.traits.filter(t => customProjects.includes(t));
    const projectsStr = projectList.length > 0 ? projectList.join('、') : '无';

    const styles = ['真挚感人', '轻快活泼', '典雅庄重', '言简意赅', '富有启发性', '充满期待'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    template = template.replace(/{{name}}/g, s.name);
    template = template.replace(/{{gender}}/g, genderStr);
    template = template.replace(/{{rank_label}}/g, rankLabel);
    template = template.replace(/{{traits}}/g, traitsStr);
    template = template.replace(/{{projects}}/g, projectsStr);

    return `Student ID: ${s.id}\nTarget Tone: ${randomStyle}\nRequest:\n${template}`;
  }).join('\n\n---\n\n');

  const prompt = `你是一位拥有20年教龄的资深班主任，正在为班上学生撰写期末评语。

【核心指令：严禁雷同，拒绝平庸】
1. **独立创作**：每一份评语都必须是一个全新的、独特的创作过程。即使两个学生性格相似，表达方式也必须完全不同。
2. **拒绝套路**：严禁出现“该生是领头羊”、“表现优秀”、“需再接再厉”等机械化的教条用词。
3. **具象化描写**：用具体的行为、微妙的性格观察、或者生动的比喻来代替空洞的形容词。
4. **语气多样化**：有的评语可以像长辈叮咛，有的可以像朋友寄语，有的可以带一点诗意。
5. **动态生成**：不要在大脑中预设模板。读取每个学生的“性格特征”和“参与活动”，为他们定制一段话。

【写作导引】
- 针对“{{name}}同学”，根据下方的 Request 细节进行扩展。
- 如果有活动记录，要把活动作为性格的注脚；如果没有活动，侧重描写其平时的处事细节。
- 引导家长看到孩子身上闪光的、独特的生命力。

【学生任务列表】：
${batchRequests}

【输出格式】
严格返回纯 JSON 格式，不要包含任何 Markdown 标记或额外解释。
Key 为 Student ID，Value 为评语正文（不含姓名开头，直接从内容开始写）：
{
  "student_1": "评语内容...",
  "student_2": "评语内容..."
}`;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: '你是一位智能评语助手。请务必返回纯JSON格式，不要包含Markdown代码块标记。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Batch Generation error:', error);
    throw error;
  }
}

// 单条生成函数保留，但逻辑同步更新
export async function generateComment(student: Student, config: ApiConfig): Promise<string> {
  // ... (由于主要使用批量生成，单条逻辑可暂时简化或复用批量逻辑的Prompt思想，这里为了节省Token，我们直接调用Batch逻辑处理单人)
  const result = await generateBatchComments([student], config);
  return result[student.id];
}
