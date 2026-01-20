export type StudentRank = 'TOP' | 'HIGH' | 'MIDDLE' | 'LOW' | 'NEEDS_SUPPORT';

export interface Student {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  rank: StudentRank;
  traits: string[];
  comment?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  selected?: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  customProjects: string[]; // 用户自定义的项目
  customPersonality: string[]; // 用户自定义性格
  customBehavior: string[]; // 用户自定义表现
  promptTemplate: string;
}

export const DEFAULT_PROMPT_TEMPLATE = `你是一位拥有20年教龄的资深班主任。请为学生{{name}}同学撰写期末评语。

【学生信息】
- 性别：{{gender}}
- 成绩概况：{{rank_label}}
- 性格与习惯：{{traits}}
- 参与活动：{{projects}}

【写作要求】
1. **称谓正式**：必须以“{{name}}同学”开头。
2. **严禁编造**：如果“参与活动”为空，绝对不要编造任何活动经历，侧重描写其性格和习惯即可。
3. **字数限制**：控制在100字左右，避免啰嗦。
4. **文化底蕴**：请根据学生特点，自然融入一句贴切的诗词、名言或成语。
5. **拒绝平庸**：不要使用“该生”、“领头羊”等固定套话，要写得有温度、有画面感。`;

export const DEFAULT_PROJECTS = [
  // 体育/竞技
  '校运会接力', '跳绳比赛', '篮球联赛', '足球队主力', '拔河比赛', '广播操领操',
  // 艺术/才艺
  '校园十佳歌手', '合唱比赛', '元旦汇演', '绘画比赛', '书法展示', '英语配音', '课本剧表演',
  // 科技/学科
  '科技节水火箭', '机器人编程', '数学竞赛', '科学小实验', '读书分享会', '英语角',
  // 德育/职务
  '黑板报设计', '爱心义卖', '志愿者服务', '升旗手', '图书管理员', '值日组长', '研学旅行', '社会实践'
];

export const DEFAULT_PERSONALITY = [
  '活泼开朗', '文静内敛', '踏实稳重', '思维活跃', '自信大方', '谦逊有礼',
  '坚毅果敢', '自律性强', '古灵精怪', '温润如玉', '阳光自信', '善解人意',
  '诚实守信', '幽默风趣', '慢热细致', '倔强不服输', '乐观向上', '情感细腻',
  '正义感强', '独立自主', '憨厚老实', '灵气十足'
];

export const DEFAULT_BEHAVIOR = [
  // 学习习惯
  '积极举手', '听讲专注', '勤于思考', '笔记详实', '字迹工整', '喜爱阅读',
  '按时交作业', '善于提问', '错题整理', '知识面广',
  // 行为表现
  '乐于助人', '纪律性强', '热爱劳动', '集体感强', '尊敬师长', '团结同学',
  '讲究卫生', '举止文明', '诚实不说谎', '乐于分享', '坐姿端正', '虽调皮但有礼'
];

export const RANK_LABELS: Record<StudentRank, string> = {
  TOP: '卓越 (前20%)',
  HIGH: '优秀 (20-40%)',
  MIDDLE: '中等 (40-60%)',
  LOW: '中下 (60-80%)',
  NEEDS_SUPPORT: '后进 (80-100%)',
};
