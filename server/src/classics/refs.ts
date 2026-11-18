// 古籍参考：只收维基文库《紫微斗數全書》卷一至卷三里逐字核到的原文（quanshu.json），每句配好白话。
// 原文只删不改：一句里只取需要的分句，中间用「……」连接；句读按通行写法加逗号。
// 不收：疾病、生死、婚变刑克、子女数目、风化、六亲刑伤（test/classics.test.ts 会逐句检查）。
// 白话说清古人的意思，用"古人认为"一类的说法收住，不加今天的断语。

export type PalaceName =
  | '命宫' | '兄弟宫' | '夫妻宫' | '子女宫' | '财帛宫' | '疾厄宫'
  | '迁移宫' | '交友宫' | '官禄宫' | '田宅宫' | '福德宫' | '父母宫';

export interface QuoteEntry {
  /** 这句说的是哪颗主星 */
  star: string;
  /** 卷二按宫位写的条目；不写 = 这颗星本身的性情 */
  palace?: PalaceName;
  /** 命宫里两颗主星同宫时才用（骨髓赋一类的组合句） */
  combo?: [string, string];
  /** 原文是"××同……"：这些星都在这一宫时才用 */
  with?: string[];
  /** 这些星有一颗在这一宫时才用 */
  withAny?: string[];
  text: string;
  source: string;
  plain: string;
  /** 原文带的亮度条件（"入庙""庙旺"），不满足时照样列出，并说明"只算一半" */
  bright?: string[];
  /** 原文带的地支条件（"在子午宫"） */
  branches?: string[];
  /** 固定的补充说明 */
  note?: string;
}

const Q1 = (sec: string) => `《紫微斗数全书》卷一 · ${sec}`;
const Q2 = (sec: string) => `《紫微斗数全书》卷二 · ${sec}`;
const MIAO = ['庙'];
const MIAO_WANG = ['庙', '旺'];
const SERVANT = '古书说的"奴仆"是旧时的仆人，今天一般对应同事、下属和朋友。';

export const QUOTES: QuoteEntry[] = [
  // ── 星本身的性情（命宫用；其他宫没有专门的句子时也用它） ──
  { star: '紫微', text: '为人忠厚老成，谦恭耿直', source: Q2('命宫'), plain: '紫微坐命的人，为人忠厚稳重，谦和正直。' },
  { star: '天机', text: '性急心慈，机谋多变', source: Q2('命宫'), plain: '天机的人性子急、心地软，主意多、变得快。' },
  { star: '太阳', text: '太阳原属火，正主官禄星，若居身命位，禀性最聪明，慈爱量宽大', source: Q1('问太阳所主若何'), plain: '太阳在命宫或身宫的人聪明，心地慈爱，度量大。' },
  { star: '武曲', text: '武曲性刚果决，心直无毒', source: Q2('命宫'), plain: '武曲的人性子刚、做事果断，心直，没有坏心眼。' },
  { star: '天同', text: '身命值之，主为人谦逊，禀性温和', source: Q1('问天同星所主若何'), plain: '天同在命宫或身宫的人，为人谦逊，性子温和。' },
  { star: '廉贞', text: '廉贞守命亦非常，赋性巍巍志气强', source: Q2('命宫'), plain: '廉贞坐命的人不一般，性子高，志气强。' },
  { star: '天府', text: '心性温和，聪明俊秀，博学机变', source: Q2('命宫'), plain: '天府的人心性温和、聪明清秀，学得多，反应快。' },
  { star: '太阴', text: '太阴居命面方圆，心性温和，清秀耿直聪明', source: Q2('命宫'), plain: '太阴坐命的人心性温和，清秀耿直，聪明。' },
  { star: '贪狼', text: '性格不常，心多计较，作事急速不耐静', source: Q2('命宫'), plain: '贪狼的人性子多变、心思多，做事快，闲不住。' },
  { star: '巨门', text: '巨门水，北斗化暗，主是非', source: Q2('命宫'), plain: '古人说巨门"化暗"，管口舌是非：会说、爱辩，也容易惹争论。' },
  { star: '天相', text: '若人命逢之，言语诚实，事不虚伪', source: Q1('问天相星所主若何'), plain: '天相坐命的人说话实在，做事不作假。' },
  { star: '天梁', text: '厚重清秀，聪明耿直，心无私曲好济施', source: Q2('命宫'), plain: '天梁的人厚道稳重、聪明正直，没有私心，乐于帮人。' },
  { star: '七杀', text: '七杀斗中上将，遇紫微则化权降福', source: Q1('问七杀星所主若何'), plain: '七杀是星里的大将；遇到紫微，冲劲会变成掌权的本事。' },
  { star: '破军', text: '性刚寡合，好争强', source: Q2('命宫'), plain: '破军的人性子刚，不太合群，好强。' },

  // ── 命宫：两颗主星同宫 ──
  { star: '太阳', combo: ['太阳', '巨门'], text: '巨日同宫，官封三代', source: Q1('斗数骨髓赋'), plain: '太阳、巨门同在命宫，古人认为是能显达的格局。' },
  { star: '太阳', combo: ['太阳', '太阴'], text: '日月同临，官居侯伯', source: Q1('斗数骨髓赋'), plain: '太阳、太阴一同守命，古人认为能做到高官。' },
  { star: '天机', combo: ['天机', '巨门'], text: '巨机同宫公卿之位', source: Q1('斗数骨髓赋'), plain: '巨门、天机同在命宫，古人认为是能做大官的格局。' },
  { star: '紫微', combo: ['紫微', '天府'], text: '紫府同宫终身福厚', source: Q1('斗数骨髓赋'), plain: '紫微、天府同在命宫，古人认为一辈子福气厚。' },

  // ── 夫妻宫（卷二 · 妻妾） ──
  { star: '紫微', palace: '夫妻宫', text: '紫微晚聘谐老性刚', source: Q2('妻妾'), plain: '紫微在夫妻宫，晚一点成婚能白头到老，伴侣性子偏刚。' },
  { star: '紫微', palace: '夫妻宫', with: ['天府'], text: '紫微晚聘谐老性刚，天府同谐老', source: Q2('妻妾'), plain: '紫微在夫妻宫，晚一点成婚能白头到老；和天府在一起，同样能白头到老。' },
  { star: '天机', palace: '夫妻宫', with: ['太阴'], text: '……太阴同内助美容', source: Q2('妻妾'), plain: '天机和太阴在夫妻宫，伴侣能帮衬你，相貌也好。' },
  { star: '太阳', palace: '夫妻宫', text: '太阳庙旺迟娶吉', source: Q2('妻妾'), plain: '太阳在夫妻宫又力道足，晚一点成婚更好。', bright: MIAO_WANG },
  { star: '天同', palace: '夫妻宫', text: '天同迟娶谐老，夫宜长妻宜少', source: Q2('妻妾'), plain: '天同在夫妻宫，晚一点成家更能白头到老；古人认为丈夫年长一些更合适。', note: '"夫宜长妻宜少"是古人的婚配观念，只作文化参考。' },
  { star: '天同', palace: '夫妻宫', with: ['太阴'], text: '天同迟娶谐老，……太阴同助美容', source: Q2('妻妾'), plain: '天同在夫妻宫，晚一点成家更能白头到老；和太阴在一起，伴侣相貌好。' },
  { star: '天同', palace: '夫妻宫', with: ['天梁'], text: '天同迟娶谐老，……天梁同极美夫妇', source: Q2('妻妾'), plain: '天同在夫妻宫，晚一点成家更能白头到老；和天梁在一起，夫妻感情极好。' },
  { star: '天府', palace: '夫妻宫', text: '天府相生宠爱夫主贵，……晚娶得谐老', source: Q2('妻妾'), plain: '天府在夫妻宫，伴侣疼爱你，也有贵气；晚一点成家能白头到老。' },
  { star: '太阴', palace: '夫妻宫', text: '太阴入庙男女皆贵美夫妇，加昌曲极美', source: Q2('妻妾'), plain: '太阴在夫妻宫又力道足，夫妻都体面、相貌好；再有文昌、文曲更好。', bright: MIAO },
  { star: '太阴', palace: '夫妻宫', with: ['太阳'], text: '……太阳同谐老', source: Q2('妻妾'), plain: '太阴和太阳在夫妻宫，能白头到老。' },
  { star: '贪狼', palace: '夫妻宫', text: '……入庙宜迟娶', source: Q2('妻妾'), plain: '贪狼在夫妻宫力道足时，宜晚一点成家。', bright: MIAO },
  { star: '巨门', palace: '夫妻宫', with: ['太阳'], text: '……太阳同无四杀加谐老', source: Q2('妻妾'), plain: '巨门和太阳在夫妻宫、又没有煞星时，能白头到老。' },
  { star: '巨门', palace: '夫妻宫', with: ['天机'], text: '……天机同内助美貌', source: Q2('妻妾'), plain: '巨门和天机在夫妻宫，伴侣能帮衬你，相貌也好。' },
  { star: '巨门', palace: '夫妻宫', with: ['天同'], text: '……天同同性聪之妻并头', source: Q2('妻妾'), plain: '巨门和天同在夫妻宫，伴侣聪明，能和你并肩。' },
  { star: '天相', palace: '夫妻宫', text: '天相貌美贤淑夫宜年长，亲上成亲', source: Q2('妻妾'), plain: '天相在夫妻宫，伴侣相貌好、贤惠；古人认为丈夫年长些合适，也常见亲上加亲。' },
  { star: '天相', palace: '夫妻宫', with: ['紫微'], text: '天相貌美贤淑夫宜年长，……紫微同谐老', source: Q2('妻妾'), plain: '天相在夫妻宫，伴侣相貌好、贤惠；和紫微在一起，能白头到老。' },
  { star: '天梁', palace: '夫妻宫', text: '天梁妻宜大美容', source: Q2('妻妾'), plain: '天梁在夫妻宫，古人认为伴侣宜年长些，相貌好。' },
  { star: '天梁', palace: '夫妻宫', with: ['天同'], text: '天梁妻宜大美容，天同同和气', source: Q2('妻妾'), plain: '天梁在夫妻宫，古人认为伴侣宜年长些、相貌好；和天同在一起，相处和气。' },
  { star: '天梁', palace: '夫妻宫', with: ['天机'], text: '天梁妻宜大美容，……天机招美淑', source: Q2('妻妾'), plain: '天梁在夫妻宫，古人认为伴侣宜年长些；和天机在一起，伴侣美好贤淑。' },

  // ── 财帛宫 ──
  { star: '紫微', palace: '财帛宫', text: '紫微丰足仓箱', source: Q2('财帛'), plain: '紫微在财帛宫，钱粮丰足。' },
  { star: '紫微', palace: '财帛宫', with: ['天相'], text: '紫微丰足仓箱，……天相同财帛蓄积', source: Q2('财帛'), plain: '紫微在财帛宫，钱粮丰足；和天相在一起，能攒下钱。' },
  { star: '紫微', palace: '财帛宫', with: ['破军'], text: '紫微丰足仓箱，……破军同先难后易', source: Q2('财帛'), plain: '紫微在财帛宫，钱粮丰足；和破军在一起，先难后易。' },
  { star: '天机', palace: '财帛宫', text: '天机劳心费力生财', source: Q2('财帛'), plain: '天机管的钱，靠动脑、费心思挣来。' },
  { star: '天机', palace: '财帛宫', with: ['巨门'], text: '天机劳心费力生财，巨门同闹中求取', source: Q2('财帛'), plain: '天机管的钱，靠动脑、费心思挣来；和巨门在一起，要到热闹、有竞争的地方去争取。' },
  { star: '天机', palace: '财帛宫', with: ['天梁'], text: '天机劳心费力生财，……天梁同机关巧计生外财', source: Q2('财帛'), plain: '天机管的钱，靠动脑、费心思挣来；和天梁在一起，能靠巧思和本事挣到额外的钱。' },
  { star: '太阳', palace: '财帛宫', text: '太阳入庙丰足', source: Q2('财帛'), plain: '太阳在财帛宫又力道足，钱粮丰足。', bright: MIAO },
  { star: '太阳', palace: '财帛宫', with: ['太阴'], text: '……太阴同加左右吉星发财不小', source: Q2('财帛'), plain: '太阳和太阴在财帛宫，再有左辅、右弼这类吉星，发财不小。' },
  { star: '太阳', palace: '财帛宫', with: ['巨门'], text: '……巨门同早年成败中未充盈', source: Q2('财帛'), plain: '太阳和巨门在财帛宫，早年有成有败，中年以后才渐渐宽裕。' },
  { star: '武曲', palace: '财帛宫', text: '武曲丰足化吉有巨万家资', source: Q2('财帛'), plain: '武曲在财帛宫，钱粮丰足；再遇到吉化，家资可观。' },
  { star: '武曲', palace: '财帛宫', with: ['天相'], text: '武曲丰足化吉有巨万家资，……天相同财帛丰盈', source: Q2('财帛'), plain: '武曲在财帛宫，钱粮丰足；和天相在一起，财物丰盈。' },
  { star: '天同', palace: '财帛宫', text: '天同白手生财晚发', source: Q2('财帛'), plain: '天同在财帛宫，白手起家，发得晚。' },
  { star: '天同', palace: '财帛宫', with: ['天梁'], text: '天同白手生财晚发，……天梁同财大旺', source: Q2('财帛'), plain: '天同在财帛宫，白手起家，发得晚；和天梁在一起，财运大旺。' },
  { star: '天同', palace: '财帛宫', with: ['巨门'], text: '天同白手生财晚发，巨门同财气进退', source: Q2('财帛'), plain: '天同在财帛宫，白手起家，发得晚；和巨门在一起，钱有进有退。' },
  { star: '廉贞', palace: '财帛宫', text: '廉贞在申寅宫闹中生财', source: Q2('财帛'), plain: '廉贞在寅宫、申宫，适合在热闹、有竞争的地方生财。', branches: ['寅', '申'] },
  { star: '天府', palace: '财帛宫', text: '天府富足', source: Q2('财帛'), plain: '天府在财帛宫，财物富足。' },
  { star: '天府', palace: '财帛宫', with: ['紫微'], text: '天府富足，……紫微同巨积', source: Q2('财帛'), plain: '天府在财帛宫，财物富足；和紫微在一起，能积下大财。' },
  { star: '太阴', palace: '财帛宫', text: '太阴入庙富足仓箱', source: Q2('财帛'), plain: '太阴在财帛宫又力道足，钱粮富足。', bright: MIAO },
  { star: '太阴', palace: '财帛宫', with: ['太阳'], text: '……太阳同先少后多', source: Q2('财帛'), plain: '太阴和太阳在财帛宫，钱先少后多。' },
  { star: '太阴', palace: '财帛宫', with: ['天机'], text: '……天机同白手生财成家', source: Q2('财帛'), plain: '太阴和天机在财帛宫，能白手起家。' },
  { star: '太阴', palace: '财帛宫', with: ['天同'], text: '……天同同财旺生身', source: Q2('财帛'), plain: '太阴和天同在财帛宫，财运旺。' },
  { star: '贪狼', palace: '财帛宫', text: '贪狼庙旺横发', source: Q2('财帛'), plain: '贪狼在财帛宫又力道足，容易有意外之财。', bright: MIAO_WANG },
  { star: '贪狼', palace: '财帛宫', with: ['紫微'], text: '……紫微同守现成，家计自后更丰盈', source: Q2('财帛'), plain: '贪狼和紫微在财帛宫，守着现成的家业，后来更宽裕。' },
  { star: '巨门', palace: '财帛宫', text: '巨门白手生财成家，宜闹中取', source: Q2('财帛'), plain: '巨门在财帛宫，白手起家，适合到热闹、有竞争的地方去挣。' },
  { star: '天相', palace: '财帛宫', text: '天相富足', source: Q2('财帛'), plain: '天相在财帛宫，财物富足。' },
  { star: '天相', palace: '财帛宫', with: ['紫微'], text: '天相富足，紫微同财气横进', source: Q2('财帛'), plain: '天相在财帛宫，财物富足；和紫微在一起，财运来得快。' },
  { star: '天相', palace: '财帛宫', with: ['廉贞'], text: '天相富足，……廉贞同商贾生财', source: Q2('财帛'), plain: '天相在财帛宫，财物富足；和廉贞在一起，适合做买卖生财。' },
  { star: '天梁', palace: '财帛宫', text: '天梁富足入庙上等富贵', source: Q2('财帛'), plain: '天梁在财帛宫，财物富足；力道足时是上等的富贵。', bright: MIAO },
  { star: '天梁', palace: '财帛宫', with: ['天同'], text: '天梁富足，……天同同白手生财胜祖', source: Q2('财帛'), plain: '天梁在财帛宫，财物富足；和天同在一起，白手起家，能胜过祖辈。' },
  { star: '破军', palace: '财帛宫', text: '破军在子午宫，多有金银宝贝蓄积', source: Q2('财帛'), plain: '破军在子宫、午宫，能攒下财物。', branches: ['子', '午'] },

  // ── 迁移宫 ──
  { star: '紫微', palace: '迁移宫', with: ['左辅', '右弼'], text: '紫微同左右出外贵人扶持发福', source: Q2('迁移'), plain: '紫微在迁移宫，又有左辅、右弼，出门有贵人扶持。' },
  { star: '紫微', palace: '迁移宫', with: ['天府'], text: '……天府同出入通达', source: Q2('迁移'), plain: '紫微和天府在迁移宫，出入顺达。' },
  { star: '紫微', palace: '迁移宫', with: ['天相'], text: '……天相同在外发财', source: Q2('迁移'), plain: '紫微和天相在迁移宫，在外能发财。' },
  { star: '天机', palace: '迁移宫', text: '天机出外遇贵居家有是非', source: Q2('迁移'), plain: '天机在迁移宫，出门遇贵人，待在家里反而多是非。' },
  { star: '天机', palace: '迁移宫', with: ['巨门'], text: '天机出外遇贵居家有是非，巨门同动中则吉', source: Q2('迁移'), plain: '天机在迁移宫，出门遇贵人；和巨门在一起，多动比静守好。' },
  { star: '天机', palace: '迁移宫', with: ['天梁'], text: '天机出外遇贵居家有是非，……天梁同出外称意', source: Q2('迁移'), plain: '天机在迁移宫，出门遇贵人；和天梁在一起，在外称心如意。' },
  { star: '天机', palace: '迁移宫', with: ['太阴'], text: '天机出外遇贵居家有是非，……太阴同忙中吉', source: Q2('迁移'), plain: '天机在迁移宫，出门遇贵人；和太阴在一起，在外虽忙，结果是好的。' },
  { star: '太阳', palace: '迁移宫', text: '太阳宜出外发福不耐静守', source: Q2('迁移'), plain: '太阳在迁移宫，适合出门发展，不爱守在一处。' },
  { star: '太阳', palace: '迁移宫', with: ['太阴'], text: '太阳宜出外发福不耐静守，太阴同出外忙中吉', source: Q2('迁移'), plain: '太阳在迁移宫，适合出门发展，不爱守在一处；和太阴在一起，在外虽然忙，结果是好的。' },
  { star: '太阳', palace: '迁移宫', with: ['巨门'], text: '太阳宜出外发福不耐静守，……巨门劳心', source: Q2('迁移'), plain: '太阳在迁移宫，适合出门发展；和巨门在一起，在外会多操心。' },
  { star: '武曲', palace: '迁移宫', text: '武曲闹忙中进少不宜静守', source: Q2('迁移'), plain: '武曲在迁移宫，在外奔忙，不宜守着不动。' },
  { star: '武曲', palace: '迁移宫', with: ['贪狼'], text: '武曲闹忙中进少不宜静守，贪狼同作巨商', source: Q2('迁移'), plain: '武曲在迁移宫，在外奔忙；和贪狼在一起，适合做大买卖。' },
  { star: '天同', palace: '迁移宫', text: '天同出外遇贵人扶持', source: Q2('迁移'), plain: '天同在迁移宫，出门有贵人扶持。' },
  { star: '天同', palace: '迁移宫', with: ['天梁'], text: '天同出外遇贵人扶持，……天梁同贵人见爱', source: Q2('迁移'), plain: '天同在迁移宫，出门有贵人扶持；和天梁在一起，贵人更看重你。' },
  { star: '廉贞', palace: '迁移宫', text: '廉贞出外通达近贵，在家日少', source: Q2('迁移'), plain: '廉贞在迁移宫，出门顺达，能接近贵人，在家的日子少。' },
  { star: '廉贞', palace: '迁移宫', with: ['七杀'], text: '廉贞出外通达近贵，……七杀同在外广招财', source: Q2('迁移'), plain: '廉贞在迁移宫，出门顺达；和七杀在一起，在外能广开财路。' },
  { star: '天府', palace: '迁移宫', text: '天府出外遇贵人扶', source: Q2('迁移'), plain: '天府在迁移宫，出门有贵人扶持。' },
  { star: '太阴', palace: '迁移宫', text: '太阴入庙出外遇贵发财', source: Q2('迁移'), plain: '太阴在迁移宫又力道足，出门遇贵人，能发财。', bright: MIAO },
  { star: '太阴', palace: '迁移宫', with: ['太阳'], text: '……太阳同极美', source: Q2('迁移'), plain: '太阴和太阳在迁移宫，古人认为极好。' },
  { star: '贪狼', palace: '迁移宫', text: '贪狼独守在外劳碌，闹中横进财', source: Q2('迁移'), plain: '贪狼在迁移宫，在外劳碌，但能在热闹中得到意外之财。' },
  { star: '巨门', palace: '迁移宫', text: '巨门出外劳心不安，与人不足多是非', source: Q2('迁移'), plain: '巨门在迁移宫，在外操心，和人容易起口角。' },
  { star: '天相', palace: '迁移宫', text: '天相出外贵人提撕', source: Q2('迁移'), plain: '天相在迁移宫，出门有贵人提携。' },
  { star: '天相', palace: '迁移宫', with: ['武曲'], text: '天相出外贵人提撕，……武曲同在外发财', source: Q2('迁移'), plain: '天相在迁移宫，出门有贵人提携；和武曲在一起，在外能发财。' },
  { star: '天梁', palace: '迁移宫', text: '天梁出外近贵贵人成就', source: Q2('迁移'), plain: '天梁在迁移宫，出门接近贵人，得贵人成全。' },
  { star: '天梁', palace: '迁移宫', with: ['天同'], text: '天梁出外近贵贵人成就，天同同福厚', source: Q2('迁移'), plain: '天梁在迁移宫，出门得贵人成全；和天同在一起，福气厚。' },
  { star: '七杀', palace: '迁移宫', text: '七杀在外日多，在家日少', source: Q2('迁移'), plain: '七杀在迁移宫，在外的日子多，在家的日子少。' },
  { star: '七杀', palace: '迁移宫', with: ['紫微'], text: '七杀在外日多，在家日少，……紫微同在外多遂志', source: Q2('迁移'), plain: '七杀在迁移宫，在外的日子多；和紫微在一起，在外多能如愿。' },
  { star: '破军', palace: '迁移宫', text: '破军出外劳心不宁，入庙在外峥嵘', source: Q2('迁移'), plain: '破军在迁移宫，在外操心、不得安宁；力道足时能在外闯出名堂。' },

  // ── 交友宫（卷二 · 奴仆） ──
  { star: '紫微', palace: '交友宫', text: '紫微成行得力，旺主生财', source: Q2('奴仆'), plain: '紫微在这一宫，身边帮手成群、得力，还能帮你生财。', note: SERVANT },
  { star: '天机', palace: '交友宫', text: '天机入庙得力', source: Q2('奴仆'), plain: '天机在这一宫又力道足，身边的人得力。', bright: MIAO, note: SERVANT },
  { star: '太阳', palace: '交友宫', text: '太阳入庙旺主发', source: Q2('奴仆'), plain: '太阳在这一宫又力道足，身边的人能帮你兴旺。', bright: MIAO, note: SERVANT },
  { star: '武曲', palace: '交友宫', text: '武曲旺宫不少，一呼百诺', source: Q2('奴仆'), plain: '武曲在这一宫又力道足，身边帮手多，一呼百应。', bright: MIAO_WANG, note: SERVANT },
  { star: '天同', palace: '交友宫', text: '天同得力旺相', source: Q2('奴仆'), plain: '天同在这一宫，身边的人得力。', note: SERVANT },
  { star: '天府', palace: '交友宫', text: '天府得力一呼百诺', source: Q2('奴仆'), plain: '天府在这一宫，身边的人得力，一呼百应。', note: SERVANT },
  { star: '太阴', palace: '交友宫', text: '太阴庙地得力成行', source: Q2('奴仆'), plain: '太阴在这一宫又力道足，得力的帮手成群。', bright: MIAO, note: SERVANT },
  { star: '天相', palace: '交友宫', text: '天相末年招得', source: Q2('奴仆'), plain: '天相在这一宫，到晚年才有得力的帮手。', note: SERVANT },
  { star: '天梁', palace: '交友宫', text: '天梁奴多旺主', source: Q2('奴仆'), plain: '天梁在这一宫，帮手多，能帮你兴旺。', note: SERVANT },
  { star: '破军', palace: '交友宫', text: '破军入庙得力', source: Q2('奴仆'), plain: '破军在这一宫又力道足，身边的人得力。', bright: MIAO, note: SERVANT },

  // ── 官禄宫 ──
  { star: '紫微', palace: '官禄宫', text: '紫微庙旺遇左右昌曲魁钺，轩胜位至封候伯', source: Q2('官禄'), plain: '紫微在官禄宫又力道足，再遇到左右、昌曲、魁钺这些帮手，古人认为事业上能站到很高的位置。', bright: MIAO_WANG },
  { star: '紫微', palace: '官禄宫', with: ['天府'], text: '……天府同权贵名利两全', source: Q2('官禄'), plain: '紫微和天府在官禄宫，有地位，名和利都能得到。' },
  { star: '紫微', palace: '官禄宫', with: ['天相'], text: '……天相加内外权贵清正', source: Q2('官禄'), plain: '紫微和天相在官禄宫，有地位，为人清正。' },
  { star: '天机', palace: '官禄宫', text: '天机入庙权贵', source: Q2('官禄'), plain: '天机在官禄宫又力道足，事业上有权有位。', bright: MIAO },
  { star: '天机', palace: '官禄宫', with: ['天梁'], text: '天机入庙权贵，……天梁同文武之材', source: Q2('官禄'), plain: '天机在官禄宫，力道足时有权有位；和天梁在一起，文武都能成材。', bright: MIAO },
  { star: '天机', palace: '官禄宫', with: ['太阴'], text: '天机入庙权贵，……太阴同名振边夷', source: Q2('官禄'), plain: '天机在官禄宫，力道足时有权有位；和太阴在一起，名声能传得很远。', bright: MIAO },
  { star: '太阳', palace: '官禄宫', text: '太阳入庙文武为良', source: Q2('官禄'), plain: '太阳在官禄宫又力道足，文职、实务都能做好。', bright: MIAO },
  { star: '太阳', palace: '官禄宫', with: ['太阴'], text: '太阳入庙文武为良，……太阴同贵显', source: Q2('官禄'), plain: '太阳在官禄宫，力道足时文职、实务都能做好；和太阴在一起，显贵。', bright: MIAO },
  { star: '武曲', palace: '官禄宫', text: '武曲入庙与昌曲左右同宫，武职峥嵘', source: Q2('官禄'), plain: '武曲在官禄宫又力道足，再有文昌文曲、左辅右弼，适合在需要魄力、带头冲的岗位上出头。', bright: MIAO },
  { star: '天同', palace: '官禄宫', text: '天同入庙文武皆宜，无羊陀火铃吉', source: Q2('官禄'), plain: '天同力道足、又没有煞星时，做文职、做实务都合适。', bright: MIAO },
  { star: '天同', palace: '官禄宫', with: ['巨门'], text: '……巨门同先小后大', source: Q2('官禄'), plain: '天同和巨门在官禄宫，事业先小后大。' },
  { star: '廉贞', palace: '官禄宫', text: '廉贞入庙武职权贵不耐久', source: Q2('官禄'), plain: '廉贞在官禄宫又力道足，适合需要魄力的岗位，能掌权，但不一定长久。', bright: MIAO },
  { star: '廉贞', palace: '官禄宫', withAny: ['天相', '天府'], text: '……天相天府同衣锦富贵', source: Q2('官禄'), plain: '廉贞和天相或天府在官禄宫，事业上体面富贵。' },
  { star: '天府', palace: '官禄宫', text: '天府入庙文武皆吉', source: Q2('官禄'), plain: '天府在官禄宫又力道足，做文职、做实务都好。', bright: MIAO },
  { star: '天府', palace: '官禄宫', with: ['紫微'], text: '天府入庙文武皆吉，……紫微同文武声名', source: Q2('官禄'), plain: '天府在官禄宫，力道足时文职、实务都好；和紫微在一起，能有名声。', bright: MIAO },
  { star: '太阴', palace: '官禄宫', text: '太阴入庙多贵', source: Q2('官禄'), plain: '太阴在官禄宫又力道足，事业上多显贵。', bright: MIAO },
  { star: '太阴', palace: '官禄宫', with: ['天同'], text: '太阴入庙多贵，……天同同文武皆宜', source: Q2('官禄'), plain: '太阴在官禄宫，力道足时多显贵；和天同在一起，文职、实务都合适。', bright: MIAO },
  { star: '贪狼', palace: '官禄宫', with: ['紫微'], text: '……紫微同文武之职权贵非小', source: Q2('官禄'), plain: '贪狼和紫微在官禄宫，文职、实务都能做，地位不低。' },
  { star: '巨门', palace: '官禄宫', text: '巨门入庙武职权贵，文人不耐久', source: Q2('官禄'), plain: '巨门在官禄宫又力道足，适合需要魄力、敢说敢争的岗位；做文职反而难长久。', bright: MIAO },
  { star: '巨门', palace: '官禄宫', with: ['天机'], text: '……天机同在卯宫吉美', source: Q2('官禄'), plain: '巨门和天机在官禄宫、又在卯宫时，古人认为很好。', branches: ['卯'] },
  { star: '天相', palace: '官禄宫', text: '天相入庙文武皆宜食禄千钟', source: Q2('官禄'), plain: '天相在官禄宫又力道足，文职、实务都合适，俸禄丰厚。', bright: MIAO },
  { star: '天相', palace: '官禄宫', with: ['紫微'], text: '……紫微同权贵', source: Q2('官禄'), plain: '天相和紫微在官禄宫，有权有位。' },
  { star: '天梁', palace: '官禄宫', text: '天梁庙午会左右魁钺，文武之材', source: Q2('官禄'), plain: '天梁在午宫、又遇到左辅右弼、天魁天钺这些帮手，文武都能成材。', branches: ['午'] },
  { star: '天梁', palace: '官禄宫', with: ['天同'], text: '……天同同权贵不小', source: Q2('官禄'), plain: '天梁和天同在官禄宫，地位不低。' },
  { star: '天梁', palace: '官禄宫', with: ['天机'], text: '……天机同峥嵘贵显', source: Q2('官禄'), plain: '天梁和天机在官禄宫，能出人头地、显贵。' },
  { star: '七杀', palace: '官禄宫', text: '七杀庙旺武职峥嵘权贵非小', source: Q2('官禄'), plain: '七杀在官禄宫又力道足，适合需要魄力、带头冲的岗位，能出人头地。', bright: MIAO_WANG },
  { star: '破军', palace: '官禄宫', text: '破军庙旺武职轩胜', source: Q2('官禄'), plain: '破军在官禄宫又力道足，适合需要魄力、敢闯的岗位。', bright: MIAO_WANG },
  { star: '破军', palace: '官禄宫', with: ['紫微'], text: '……紫微同宫名振扬', source: Q2('官禄'), plain: '破军和紫微在官禄宫，名声能传开。' },

  // ── 田宅宫 ──
  { star: '紫微', palace: '田宅宫', text: '紫微茂盛自置旺相', source: Q2('田宅'), plain: '紫微在田宅宫，家业兴旺，多半能自己置办。' },
  { star: '紫微', palace: '田宅宫', withAny: ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'], text: '紫微茂盛自置旺相，加羊陀火铃空劫，有置有去', source: Q2('田宅'), plain: '紫微在田宅宫，家业兴旺，多半能自己置办；再遇到擎羊、陀罗、地空、地劫这类星，有买进也有卖出。' },
  { star: '紫微', palace: '田宅宫', with: ['天相'], text: '紫微茂盛自置旺相，……天相同有见成家业', source: Q2('田宅'), plain: '紫微在田宅宫，家业兴旺；和天相在一起，有现成的家业可守。' },
  { star: '天机', palace: '田宅宫', with: ['天梁'], text: '……天梁同有置晚年富', source: Q2('田宅'), plain: '天机和天梁在田宅宫，能置办产业，晚年富足。' },
  { star: '天机', palace: '田宅宫', with: ['太阴'], text: '……太阴同自置旺相', source: Q2('田宅'), plain: '天机和太阴在田宅宫，能自己置办产业。' },
  { star: '天机', palace: '田宅宫', with: ['巨门'], text: '……巨门同在卯宫有田庄', source: Q2('田宅'), plain: '天机和巨门在田宅宫、又在卯宫时，能有田产。', branches: ['卯'] },
  { star: '太阳', palace: '田宅宫', text: '太阳入庙得祖业', source: Q2('田宅'), plain: '太阳在田宅宫又力道足，能得到祖上的家业。', bright: MIAO },
  { star: '太阳', palace: '田宅宫', with: ['太阴'], text: '……太阴同加吉星田多', source: Q2('田宅'), plain: '太阳和太阴在田宅宫，再有吉星，田产多。' },
  { star: '武曲', palace: '田宅宫', text: '武曲单居旺地，得祖父大业', source: Q2('田宅'), plain: '武曲独坐田宅宫又力道足，能得到祖辈的大家业。', bright: MIAO_WANG },
  { star: '天同', palace: '田宅宫', text: '天同先少后多，自置甚旺', source: Q2('田宅'), plain: '天同在田宅宫，产业先少后多，自己置办得很旺。' },
  { star: '廉贞', palace: '田宅宫', with: ['天府'], text: '……天府同守见成家业', source: Q2('田宅'), plain: '廉贞和天府在田宅宫，能守住现成的家业。' },
  { star: '天府', palace: '田宅宫', text: '天府田园茂盛，守祖自置旺相', source: Q2('田宅'), plain: '天府在田宅宫，田产兴旺，能守住祖业，也能自己置办。' },
  { star: '天府', palace: '田宅宫', with: ['紫微'], text: '天府田园茂盛，……紫微同大富', source: Q2('田宅'), plain: '天府在田宅宫，田产兴旺；和紫微在一起，大富。' },
  { star: '太阴', palace: '田宅宫', text: '太阴入庙田多', source: Q2('田宅'), plain: '太阴在田宅宫又力道足，田产多。', bright: MIAO },
  { star: '太阴', palace: '田宅宫', with: ['天机'], text: '……天机同自创置', source: Q2('田宅'), plain: '太阴和天机在田宅宫，能自己创业置产。' },
  { star: '太阴', palace: '田宅宫', with: ['天同'], text: '……天同同白手自置', source: Q2('田宅'), plain: '太阴和天同在田宅宫，能白手起家，自己置办。' },
  { star: '贪狼', palace: '田宅宫', text: '……庙旺有祖业', source: Q2('田宅'), plain: '贪狼在田宅宫又力道足，有祖业。', bright: MIAO_WANG },
  { star: '巨门', palace: '田宅宫', text: '巨门庙旺横发置买', source: Q2('田宅'), plain: '巨门在田宅宫又力道足，能突然发达，置办产业。', bright: MIAO_WANG },
  { star: '天相', palace: '田宅宫', text: '天相庙旺有分', source: Q2('田宅'), plain: '天相在田宅宫又力道足，能分到家产。', bright: MIAO_WANG },
  { star: '天相', palace: '田宅宫', with: ['紫微'], text: '天相庙旺有分，紫微同自置', source: Q2('田宅'), plain: '天相在田宅宫，力道足时能分到家产；和紫微在一起，能自己置办。', bright: MIAO_WANG },
  { star: '天梁', palace: '田宅宫', text: '天梁入庙旺有祖业', source: Q2('田宅'), plain: '天梁在田宅宫又力道足，有祖业。', bright: MIAO_WANG },
  { star: '破军', palace: '田宅宫', text: '破军在子午宫守祖业荣昌', source: Q2('田宅'), plain: '破军在子宫、午宫，能守住祖业，家业兴旺。', branches: ['子', '午'] },

  // ── 福德宫 ──
  { star: '紫微', palace: '福德宫', text: '紫微福厚享福安乐', source: Q2('福德'), plain: '紫微在福德宫，福气厚，能安乐享福。' },
  { star: '紫微', palace: '福德宫', withAny: ['天府', '天相'], text: '紫微福厚享福安乐，天府天相同终身获吉', source: Q2('福德'), plain: '紫微在福德宫，福气厚；和天府或天相在一起，一辈子顺遂。' },
  { star: '天机', palace: '福德宫', text: '天机先劳后逸', source: Q2('福德'), plain: '天机在福德宫，先辛苦、后安逸。' },
  { star: '天机', palace: '福德宫', with: ['巨门'], text: '天机先劳后逸，巨门同劳力欠安', source: Q2('福德'), plain: '天机在福德宫，先辛苦、后安逸；和巨门在一起，容易劳累，心里不太安稳。' },
  { star: '天机', palace: '福德宫', with: ['天梁'], text: '天机先劳后逸，……天梁同享福', source: Q2('福德'), plain: '天机在福德宫，先辛苦、后安逸；和天梁在一起，能享到福。' },
  { star: '天机', palace: '福德宫', with: ['太阴'], text: '天机先劳后逸，……太阴同主快乐', source: Q2('福德'), plain: '天机在福德宫，先辛苦、后安逸；和太阴在一起，心情快乐。' },
  { star: '太阳', palace: '福德宫', text: '太阳忙中发福', source: Q2('福德'), plain: '太阳在福德宫，在忙碌中得福。' },
  { star: '太阳', palace: '福德宫', with: ['太阴'], text: '太阳忙中发福，太阴同快乐', source: Q2('福德'), plain: '太阳在福德宫，在忙碌中得福；和太阴在一起，心情快乐。' },
  { star: '太阳', palace: '福德宫', with: ['巨门'], text: '太阳忙中发福，……巨门同费力欠安', source: Q2('福德'), plain: '太阳在福德宫，在忙碌中得福；和巨门在一起，费力，心里不太安稳。' },
  { star: '太阳', palace: '福德宫', with: ['天梁'], text: '太阳忙中发福，……天梁同快乐', source: Q2('福德'), plain: '太阳在福德宫，在忙碌中得福；和天梁在一起，心情快乐。' },
  { star: '武曲', palace: '福德宫', text: '武曲劳心费力，入庙安然享福', source: Q2('福德'), plain: '武曲在福德宫，操心费力；力道足时才能安心享福。' },
  { star: '武曲', palace: '福德宫', with: ['天相'], text: '武曲劳心费力，……天相同老境安康', source: Q2('福德'), plain: '武曲在福德宫，操心费力；和天相在一起，晚年安康。' },
  { star: '天同', palace: '福德宫', text: '天同快乐有福有寿', source: Q2('福德'), plain: '天同在福德宫，心情快乐，有福气。' },
  { star: '天同', palace: '福德宫', with: ['太阴'], text: '天同快乐有福有寿，……太阴同享福', source: Q2('福德'), plain: '天同在福德宫，心情快乐；和太阴在一起，能享福。' },
  { star: '天同', palace: '福德宫', with: ['天梁'], text: '天同快乐有福有寿，……天梁同清闲快乐', source: Q2('福德'), plain: '天同在福德宫，心情快乐；和天梁在一起，清闲自在。' },
  { star: '天同', palace: '福德宫', with: ['巨门'], text: '天同快乐有福有寿，巨门同多忧少喜', source: Q2('福德'), plain: '天同在福德宫，心情快乐；和巨门在一起，操心多、高兴少。' },
  { star: '廉贞', palace: '福德宫', text: '廉贞独守忙中生福', source: Q2('福德'), plain: '廉贞独坐福德宫，在忙碌中得福。' },
  { star: '廉贞', palace: '福德宫', with: ['天相'], text: '……天相同有福有寿', source: Q2('福德'), plain: '廉贞和天相在福德宫，有福气。' },
  { star: '廉贞', palace: '福德宫', with: ['天府'], text: '……天府同安乐无忧', source: Q2('福德'), plain: '廉贞和天府在福德宫，安乐无忧。' },
  { star: '天府', palace: '福德宫', text: '天府安静享福', source: Q2('福德'), plain: '天府在福德宫，安静享福。' },
  { star: '天府', palace: '福德宫', with: ['紫微'], text: '天府安静享福，紫微同快乐', source: Q2('福德'), plain: '天府在福德宫，安静享福；和紫微在一起，心情快乐。' },
  { star: '太阴', palace: '福德宫', text: '太阴入庙享福快乐', source: Q2('福德'), plain: '太阴在福德宫又力道足，能享福，心情快乐。', bright: MIAO },
  { star: '太阴', palace: '福德宫', with: ['太阳'], text: '太阴入庙享福快乐，太阳同极美', source: Q2('福德'), plain: '太阴在福德宫，力道足时能享福；和太阳在一起，古人认为极好。', bright: MIAO },
  { star: '太阴', palace: '福德宫', with: ['天机'], text: '……天机同心忙', source: Q2('福德'), plain: '太阴和天机在福德宫，心里忙，闲不下来。' },
  { star: '太阴', palace: '福德宫', with: ['天同'], text: '……天同同安静无忧', source: Q2('福德'), plain: '太阴和天同在福德宫，安静无忧。' },
  { star: '贪狼', palace: '福德宫', text: '贪狼劳心不安', source: Q2('福德'), plain: '贪狼在福德宫，操心，心里不太安稳。' },
  { star: '贪狼', palace: '福德宫', with: ['紫微'], text: '贪狼劳心不安，……紫微同晚年快乐', source: Q2('福德'), plain: '贪狼在福德宫，操心；和紫微在一起，晚年快乐。' },
  { star: '巨门', palace: '福德宫', text: '巨门劳力不安', source: Q2('福德'), plain: '巨门在福德宫，劳累，心里不太安稳。' },
  { star: '巨门', palace: '福德宫', with: ['太阳'], text: '巨门劳力不安，太阳同有忧有喜', source: Q2('福德'), plain: '巨门在福德宫，劳累；和太阳在一起，有忧也有喜。' },
  { star: '巨门', palace: '福德宫', with: ['天机'], text: '巨门劳力不安，……天机同心忙不安', source: Q2('福德'), plain: '巨门在福德宫，劳累；和天机在一起，心里忙，不太安稳。' },
  { star: '巨门', palace: '福德宫', with: ['天同'], text: '巨门劳力不安，……天同同享福', source: Q2('福德'), plain: '巨门在福德宫，劳累；和天同在一起，能享福。' },
  { star: '天相', palace: '福德宫', text: '天相安逸享福有寿', source: Q2('福德'), plain: '天相在福德宫，安逸享福。' },
  { star: '天相', palace: '福德宫', with: ['紫微'], text: '天相安逸享福有寿，紫微同快乐', source: Q2('福德'), plain: '天相在福德宫，安逸享福；和紫微在一起，心情快乐。' },
  { star: '七杀', palace: '福德宫', text: '七杀入庙享福', source: Q2('福德'), plain: '七杀在福德宫又力道足，能享福。', bright: MIAO },
  { star: '破军', palace: '福德宫', text: '破军劳心费力', source: Q2('福德'), plain: '破军在福德宫，操心费力。' },
  { star: '破军', palace: '福德宫', with: ['紫微'], text: '破军劳心费力，……紫微同安乐', source: Q2('福德'), plain: '破军在福德宫，操心费力；和紫微在一起，安乐。' },
];

/** 一宫没有原文可列时的说明 */
export const NO_QUOTE_NOTE: Partial<Record<PalaceName, string>> = {
  疾厄宫: '这一篇不列古籍原文。身体的事请以医生的判断为准。',
};

/** 星本身的性情放在别的宫里看时，用来看什么 */
export const NATURE_AS: Partial<Record<PalaceName, string>> = {
  兄弟宫: '同辈的脾气',
  夫妻宫: '伴侣的性情',
  子女宫: '晚辈的性情',
  交友宫: '朋友、同事的性情',
  父母宫: '长辈的性情',
  财帛宫: '你对钱的作风',
  迁移宫: '你在外面的样子',
  官禄宫: '你做事的作风',
  田宅宫: '你对家的态度',
  福德宫: '你心里的状态',
};

export const REFS_FOOT = '原文出自《紫微斗数全书》（维基文库公版）。古书是古人的文学化说法，不代表今天的收入、成就或婚姻结果。';
