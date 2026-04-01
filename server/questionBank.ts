/**
 * EduAgent 内置题库
 * 包含 Python 基础知识客观题（单选+多选）、简答题、算法代码题
 */

// ===== 客观题 =====
export type ObjectiveQuestion = {
  id: number;
  type: "single" | "multiple";
  question: string;
  options: { key: string; text: string }[];
  answer: string | string[];
  explanation: string;
  tags: string[];
};

export const OBJECTIVE_QUESTIONS: ObjectiveQuestion[] = [
  // ===== 5 道单选题 =====
  {
    id: 1,
    type: "single",
    question: "在 Python 中，以下哪个关键字用于定义函数？",
    options: [
      { key: "A", text: "function" },
      { key: "B", text: "def" },
      { key: "C", text: "func" },
      { key: "D", text: "define" },
    ],
    answer: "B",
    explanation: "Python 使用 `def` 关键字定义函数，例如 `def my_func():` 。其他语言（如 JavaScript）使用 `function`，但 Python 不支持该写法。",
    tags: ["函数", "语法基础"],
  },
  {
    id: 2,
    type: "single",
    question: "Python 中列表（list）和元组（tuple）的主要区别是什么？",
    options: [
      { key: "A", text: "列表可以存储多种数据类型，元组只能存储同一种" },
      { key: "B", text: "列表是可变的，元组是不可变的" },
      { key: "C", text: "列表使用圆括号，元组使用方括号" },
      { key: "D", text: "列表比元组占用更少的内存" },
    ],
    answer: "B",
    explanation: "列表（list）是可变的（mutable），创建后可以增删改元素；元组（tuple）是不可变的（immutable），一旦创建就不能修改。两者都可以存储多种数据类型，列表用 `[]`，元组用 `()`。",
    tags: ["数据结构", "列表", "元组"],
  },
  {
    id: 3,
    type: "single",
    question: "以下代码的输出结果是什么？\n\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)",
    options: [
      { key: "A", text: "[1, 2, 3]" },
      { key: "B", text: "[1, 2, 3, 4]" },
      { key: "C", text: "[1, 2, 3] 和 [1, 2, 3, 4]" },
      { key: "D", text: "报错" },
    ],
    answer: "B",
    explanation: "在 Python 中，`y = x` 是引用赋值，`y` 和 `x` 指向同一个列表对象。因此对 `y` 的修改（`append(4)`）会同时影响 `x`，输出为 `[1, 2, 3, 4]`。若要创建独立副本，应使用 `y = x.copy()` 或 `y = x[:]`。",
    tags: ["引用赋值", "列表", "内存模型"],
  },
  {
    id: 4,
    type: "single",
    question: "Python 中 range(1, 10, 2) 生成的序列是？",
    options: [
      { key: "A", text: "1, 2, 3, 4, 5, 6, 7, 8, 9" },
      { key: "B", text: "1, 3, 5, 7, 9" },
      { key: "C", text: "2, 4, 6, 8, 10" },
      { key: "D", text: "1, 3, 5, 7" },
    ],
    answer: "B",
    explanation: "`range(start, stop, step)` 从 start 开始，以 step 为步长，到 stop 之前结束（不含 stop）。`range(1, 10, 2)` 生成 1, 3, 5, 7, 9。",
    tags: ["range", "循环", "语法基础"],
  },
  {
    id: 5,
    type: "single",
    question: "以下哪个是 Python 中正确的字典（dict）创建方式？",
    options: [
      { key: "A", text: "d = {1, 2, 3}" },
      { key: "B", text: "d = ['key': 'value']" },
      { key: "C", text: "d = {'name': 'Alice', 'age': 18}" },
      { key: "D", text: "d = ('name', 'Alice')" },
    ],
    answer: "C",
    explanation: "Python 字典使用花括号 `{}` 创建，格式为 `{key: value}`。选项 A 是集合（set），选项 B 语法错误，选项 D 是元组。",
    tags: ["字典", "数据结构", "语法基础"],
  },

  // ===== 5 道多选题 =====
  {
    id: 6,
    type: "multiple",
    question: "以下哪些是 Python 的内置数据类型？（多选）",
    options: [
      { key: "A", text: "int（整数）" },
      { key: "B", text: "array（数组）" },
      { key: "C", text: "str（字符串）" },
      { key: "D", text: "dict（字典）" },
      { key: "E", text: "vector（向量）" },
    ],
    answer: ["A", "C", "D"],
    explanation: "Python 内置数据类型包括：int、float、str、bool、list、tuple、dict、set 等。`array` 需要通过 `import array` 导入，`vector` 不是 Python 内置类型（C++ 中有 vector）。",
    tags: ["数据类型", "内置类型"],
  },
  {
    id: 7,
    type: "multiple",
    question: "关于 Python 的异常处理，以下说法正确的是？（多选）",
    options: [
      { key: "A", text: "try...except 可以捕获并处理异常" },
      { key: "B", text: "finally 块中的代码无论是否发生异常都会执行" },
      { key: "C", text: "raise 语句用于主动抛出异常" },
      { key: "D", text: "一个 try 块只能对应一个 except 块" },
    ],
    answer: ["A", "B", "C"],
    explanation: "A、B、C 均正确。D 错误：一个 `try` 块可以对应多个 `except` 块，分别处理不同类型的异常，例如 `except ValueError:` 和 `except TypeError:`。",
    tags: ["异常处理", "try-except", "错误处理"],
  },
  {
    id: 8,
    type: "multiple",
    question: "以下哪些方法可以用于字符串（str）操作？（多选）",
    options: [
      { key: "A", text: "split() — 分割字符串" },
      { key: "B", text: "append() — 追加内容" },
      { key: "C", text: "strip() — 去除首尾空白" },
      { key: "D", text: "replace() — 替换子串" },
      { key: "E", text: "pop() — 移除最后一个字符" },
    ],
    answer: ["A", "C", "D"],
    explanation: "`split()`、`strip()`、`replace()` 都是字符串的内置方法。`append()` 是列表的方法，字符串没有 `append()`；`pop()` 也是列表/字典的方法，字符串不可变，没有 `pop()`。",
    tags: ["字符串", "字符串方法"],
  },
  {
    id: 9,
    type: "multiple",
    question: "关于 Python 的面向对象编程，以下说法正确的是？（多选）",
    options: [
      { key: "A", text: "__init__ 是类的构造方法，在创建对象时自动调用" },
      { key: "B", text: "self 参数代表类本身，不代表实例" },
      { key: "C", text: "Python 支持多重继承" },
      { key: "D", text: "子类可以通过 super() 调用父类的方法" },
    ],
    answer: ["A", "C", "D"],
    explanation: "A、C、D 正确。B 错误：`self` 代表类的实例（对象），不是类本身。类本身通常用 `cls` 表示（在类方法中）。",
    tags: ["面向对象", "类", "继承"],
  },
  {
    id: 10,
    type: "multiple",
    question: "以下哪些是 Python 中合法的变量命名？（多选）",
    options: [
      { key: "A", text: "my_variable" },
      { key: "B", text: "2nd_value" },
      { key: "C", text: "_private" },
      { key: "D", text: "class" },
      { key: "E", text: "CamelCase" },
    ],
    answer: ["A", "C", "E"],
    explanation: "Python 变量名规则：只能包含字母、数字、下划线，不能以数字开头，不能使用关键字。`my_variable`、`_private`、`CamelCase` 合法；`2nd_value` 以数字开头，非法；`class` 是 Python 关键字，不能用作变量名。",
    tags: ["变量命名", "语法规则", "关键字"],
  },
];

// ===== 简答题 =====
export type ShortAnswerQuestion = {
  id: number;
  question: string;
  referenceAnswer: string;
  scoringPoints: string[];
  maxScore: number;
};

export const SHORT_ANSWER_QUESTIONS: ShortAnswerQuestion[] = [
  {
    id: 1,
    question: "请解释 Python 中的装饰器（Decorator）是什么，并给出一个简单的使用示例。",
    referenceAnswer: `装饰器是 Python 中一种特殊的语法，用于在不修改原函数代码的情况下，为函数添加额外的功能。装饰器本质上是一个接受函数作为参数并返回新函数的高阶函数，使用 @ 符号应用。

示例：
def log_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"调用函数: {func.__name__}")
        result = func(*args, **kwargs)
        print(f"函数执行完毕")
        return result
    return wrapper

@log_decorator
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")`,
    scoringPoints: [
      "正确解释装饰器的概念（不修改原函数，添加额外功能）",
      "提到装饰器是高阶函数",
      "提到使用 @ 符号应用",
      "给出正确的代码示例",
      "代码示例能正确运行",
    ],
    maxScore: 10,
  },
  {
    id: 2,
    question: "Python 中的列表推导式（List Comprehension）是什么？请举例说明其与普通 for 循环的区别，并分析其优缺点。",
    referenceAnswer: `列表推导式是 Python 中一种简洁的创建列表的方式，语法为 [expression for item in iterable if condition]。

与普通 for 循环的比较：
# 普通 for 循环
squares = []
for i in range(10):
    if i % 2 == 0:
        squares.append(i ** 2)

# 列表推导式（等价写法）
squares = [i ** 2 for i in range(10) if i % 2 == 0]

优点：代码更简洁、执行速度通常比等价的 for 循环快
缺点：复杂逻辑时可读性下降；大数据量时内存占用高，此时应使用生成器表达式`,
    scoringPoints: [
      "正确解释列表推导式的语法",
      "给出正确的代码示例",
      "与 for 循环进行对比",
      "分析优点（简洁/速度）",
      "分析缺点（复杂逻辑/内存）",
    ],
    maxScore: 10,
  },
  {
    id: 3,
    question: "请解释 Python 中 GIL（全局解释器锁）的概念，它对多线程编程有什么影响？如何绕过 GIL 的限制？",
    referenceAnswer: `GIL（Global Interpreter Lock，全局解释器锁）是 CPython 解释器中的一个互斥锁，它确保同一时刻只有一个线程在执行 Python 字节码。

对多线程的影响：
1. CPU 密集型任务：多线程无法真正并行执行，因为 GIL 限制了同时只有一个线程运行
2. I/O 密集型任务：GIL 在 I/O 等待时会释放，因此多线程对 I/O 密集型任务仍有效果

绕过 GIL 的方法：
1. 使用 multiprocessing 模块（多进程），每个进程有独立的 GIL
2. 使用 C 扩展（如 NumPy），在 C 代码中可以释放 GIL
3. 使用 concurrent.futures.ProcessPoolExecutor 进行进程池并行
4. 使用 asyncio 进行异步编程（适合 I/O 密集型）`,
    scoringPoints: [
      "正确解释 GIL 的定义",
      "说明对 CPU 密集型任务的影响",
      "说明对 I/O 密集型任务的影响",
      "提出至少两种绕过 GIL 的方法",
      "解释清晰、逻辑严谨",
    ],
    maxScore: 10,
  },
];

// ===== 代码题 =====
export type CodeQuestion = {
  id: number;
  title: string;
  category: "two-pointer" | "dp" | "array";
  categoryLabel: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints?: string[];
  referenceCode?: Record<string, string>;
};

export const CODE_QUESTIONS: CodeQuestion[] = [
  {
    id: 1,
    title: "两数之和 II（双指针）",
    category: "two-pointer",
    categoryLabel: "双指针",
    difficulty: "medium",
    description: `给定一个已按照升序排列的整数数组 numbers，请你从数组中找出两个数满足相加之和等于目标数 target。

函数应该以长度为 2 的整数数组的形式返回这两个数的下标值。numbers 的下标从 1 开始，所以答案数组应当满足 1 <= answer[0] < answer[1] <= numbers.length。

你可以假设每个输入只对应唯一的答案，而且你不可以重复使用相同的元素。

请使用双指针方法实现，时间复杂度要求 O(n)，空间复杂度要求 O(1)。`,
    examples: [
      { input: "numbers = [2,7,11,15], target = 9", output: "[1, 2]", explanation: "2 + 7 = 9，它们的下标分别为 1 和 2。" },
      { input: "numbers = [2,3,4], target = 6", output: "[1, 3]", explanation: "2 + 4 = 6，下标为 1 和 3。" },
      { input: "numbers = [-1,0], target = -1", output: "[1, 2]", explanation: "-1 + 0 = -1，下标为 1 和 2。" },
    ],
    constraints: [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "numbers 按非递减顺序排列",
      "-1000 <= target <= 1000",
      "仅存在一个有效答案",
    ],
    hints: [
      "使用左右两个指针，分别指向数组首尾",
      "若两指针之和等于 target，返回结果",
      "若和小于 target，左指针右移；若和大于 target，右指针左移",
    ],
    referenceCode: {
      python: `def twoSum(numbers, target):\n    left, right = 0, len(numbers) - 1\n    while left < right:\n        s = numbers[left] + numbers[right]\n        if s == target:\n            return [left + 1, right + 1]\n        elif s < target:\n            left += 1\n        else:\n            right -= 1\n    return []`,
    },
  },
  {
    id: 2,
    title: "最长公共子序列（动态规划）",
    category: "dp",
    categoryLabel: "动态规划",
    difficulty: "medium",
    description: `给定两个字符串 text1 和 text2，返回这两个字符串的最长公共子序列的长度。如果不存在公共子序列，返回 0。

一个字符串的子序列是指这样一个新的字符串：它是由原字符串在不改变字符的相对顺序的情况下删除某些字符（也可以不删除任何字符）后组成的新字符串。

例如，"ace" 是 "abcde" 的子序列，但 "aec" 不是 "abcde" 的子序列。

请使用动态规划方法实现。`,
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3", explanation: '最长公共子序列是 "ace"，它的长度为 3。' },
      { input: 'text1 = "abc", text2 = "abc"', output: "3", explanation: '最长公共子序列是 "abc"，它的长度为 3。' },
      { input: 'text1 = "abc", text2 = "def"', output: "0", explanation: "两个字符串没有公共子序列，返回 0。" },
    ],
    constraints: [
      "1 <= text1.length, text2.length <= 1000",
      "text1 和 text2 仅由小写英文字符组成",
    ],
    hints: [
      "定义 dp[i][j] 为 text1 前 i 个字符与 text2 前 j 个字符的最长公共子序列长度",
      "若 text1[i-1] == text2[j-1]，则 dp[i][j] = dp[i-1][j-1] + 1",
      "否则 dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
    ],
    referenceCode: {
      python: `def longestCommonSubsequence(text1, text2):\n    m, n = len(text1), len(text2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if text1[i-1] == text2[j-1]:\n                dp[i][j] = dp[i-1][j-1] + 1\n            else:\n                dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n    return dp[m][n]`,
    },
  },
  {
    id: 3,
    title: "除自身以外数组的乘积（数组）",
    category: "array",
    categoryLabel: "数组",
    difficulty: "medium",
    description: `给你一个整数数组 nums，返回数组 answer，其中 answer[i] 等于 nums 中除 nums[i] 之外其余各元素的乘积。

题目数据保证数组 nums 之中任意元素的全部前缀元素和后缀的乘积都在 32 位整数范围内。

请不要使用除法，且在 O(n) 时间复杂度内完成此题。

进阶：你可以在 O(1) 的额外空间复杂度内完成这个题目吗？（输出数组不被视为额外空间）`,
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]", explanation: "answer[0]=2*3*4=24, answer[1]=1*3*4=12, answer[2]=1*2*4=8, answer[3]=1*2*3=6" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
    ],
    constraints: [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "保证数组 nums 之中任意元素的全部前缀元素和后缀的乘积都在 32 位整数范围内",
    ],
    hints: [
      "对于每个元素，其结果 = 左侧所有元素的乘积 × 右侧所有元素的乘积",
      "先从左到右遍历，计算每个位置左侧的前缀积",
      "再从右到左遍历，乘以右侧的后缀积",
    ],
    referenceCode: {
      python: `def productExceptSelf(nums):\n    n = len(nums)\n    answer = [1] * n\n    prefix = 1\n    for i in range(n):\n        answer[i] = prefix\n        prefix *= nums[i]\n    suffix = 1\n    for i in range(n - 1, -1, -1):\n        answer[i] *= suffix\n        suffix *= nums[i]\n    return answer`,
    },
  },
];

// ===== 支持的编程语言 =====
export const SUPPORTED_LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];
