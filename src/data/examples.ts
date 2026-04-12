// ---------------------------------------------------------------------------
// 예제 갤러리 데이터
// ---------------------------------------------------------------------------

export type ExampleCategory =
  | "sorting"
  | "search"
  | "data-structure"
  | "graph"
  | "dp"
  | "recursion";

export interface CategoryMeta {
  key: ExampleCategory;
  label: string;
  labelEn: string;
}

export interface ExampleVariant {
  language: "python" | "javascript" | "java";
  code: string;
  stdin: string;
}

export interface ExampleItem {
  id: string;
  title: string;
  titleKo: string;
  category: ExampleCategory;
  tags: string[];
  difficulty: "easy" | "medium";
  variants: ExampleVariant[];
  featured: boolean;
}

// ---------------------------------------------------------------------------
// 카테고리 메타
// ---------------------------------------------------------------------------

export const CATEGORIES: CategoryMeta[] = [
  { key: "sorting", label: "정렬", labelEn: "Sorting" },
  { key: "search", label: "탐색", labelEn: "Search" },
  { key: "data-structure", label: "자료구조", labelEn: "Data Structure" },
  { key: "graph", label: "그래프", labelEn: "Graph" },
  { key: "dp", label: "DP", labelEn: "Dynamic Programming" },
  { key: "recursion", label: "재귀", labelEn: "Recursion" },
];

// ---------------------------------------------------------------------------
// 예제 데이터
// ---------------------------------------------------------------------------

export const EXAMPLES: ExampleItem[] = [
  // ── Sorting ──────────────────────────────────────────────────────────────
  {
    id: "bubble-sort",
    title: "Bubble Sort",
    titleKo: "버블 정렬",
    category: "sorting",
    tags: ["sorting", "array"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "6\n5 3 8 1 4 2",
        code: `import sys
input = sys.stdin.readline

n = int(input())
arr = list(map(int, input().split()))

for i in range(n):
  for j in range(n - 1 - i):
    if arr[j] > arr[j + 1]:
      arr[j], arr[j + 1] = arr[j + 1], arr[j]

print(*arr)`,
      },
      {
        language: "javascript",
        stdin: "6\n5 3 8 1 4 2",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

const n = parseInt(lines[0]);
const arr = lines[1].split(' ').map(Number);

for (let i = 0; i < n; i++) {
  for (let j = 0; j < n - 1 - i; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}

console.log(arr.join(' '));`,
      },
      {
        language: "java",
        stdin: "6\n5 3 8 1 4 2",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    int tmp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = tmp;
                }
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(' ');
            sb.append(arr[i]);
        }
        System.out.println(sb);
    }
}`,
      },
    ],
  },
  {
    id: "selection-sort",
    title: "Selection Sort",
    titleKo: "선택 정렬",
    category: "sorting",
    tags: ["sorting", "array"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "6\n5 3 8 1 4 2",
        code: `import sys
input = sys.stdin.readline

n = int(input())
arr = list(map(int, input().split()))

for i in range(n):
  min_idx = i
  for j in range(i + 1, n):
    if arr[j] < arr[min_idx]:
      min_idx = j
  arr[i], arr[min_idx] = arr[min_idx], arr[i]

print(*arr)`,
      },
      {
        language: "javascript",
        stdin: "6\n5 3 8 1 4 2",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

const n = parseInt(lines[0]);
const arr = lines[1].split(' ').map(Number);

for (let i = 0; i < n; i++) {
  let minIdx = i;
  for (let j = i + 1; j < n; j++) {
    if (arr[j] < arr[minIdx]) minIdx = j;
  }
  [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
}

console.log(arr.join(' '));`,
      },
      {
        language: "java",
        stdin: "6\n5 3 8 1 4 2",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        for (int i = 0; i < n; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) minIdx = j;
            }
            int tmp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = tmp;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(' ');
            sb.append(arr[i]);
        }
        System.out.println(sb);
    }
}`,
      },
    ],
  },
  {
    id: "insertion-sort",
    title: "Insertion Sort",
    titleKo: "삽입 정렬",
    category: "sorting",
    tags: ["sorting", "array"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "6\n5 3 8 1 4 2",
        code: `import sys
input = sys.stdin.readline

n = int(input())
arr = list(map(int, input().split()))

for i in range(1, n):
  key = arr[i]
  j = i - 1
  while j >= 0 and arr[j] > key:
    arr[j + 1] = arr[j]
    j -= 1
  arr[j + 1] = key

print(*arr)`,
      },
      {
        language: "javascript",
        stdin: "6\n5 3 8 1 4 2",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

const n = parseInt(lines[0]);
const arr = lines[1].split(' ').map(Number);

for (let i = 1; i < n; i++) {
  const key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j--;
  }
  arr[j + 1] = key;
}

console.log(arr.join(' '));`,
      },
      {
        language: "java",
        stdin: "6\n5 3 8 1 4 2",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(' ');
            sb.append(arr[i]);
        }
        System.out.println(sb);
    }
}`,
      },
    ],
  },

  // ── Search ───────────────────────────────────────────────────────────────
  {
    id: "binary-search",
    title: "Binary Search",
    titleKo: "이진 탐색",
    category: "search",
    tags: ["search", "array"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "6\n1 3 5 7 9 11\n6",
        code: `import sys

input = sys.stdin.readline

def main():
  n = int(input())
  a = list(map(int, input().split()))
  x = int(input())
  lo, hi = 0, n
  while lo < hi:
    mid = (lo + hi) // 2
    if a[mid] < x:
      lo = mid + 1
    else:
      hi = mid
  print(lo)

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "6\n1 3 5 7 9 11\n6",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  const n = parseInt(lines[0], 10);
  const a = lines[1].trim().split(/\\s+/).map((x) => parseInt(x, 10));
  const x = parseInt(lines[2], 10);
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  console.log(lo);
}

main();`,
      },
      {
        language: "java",
        stdin: "6\n1 3 5 7 9 11\n6",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int x = sc.nextInt();
        int lo = 0, hi = n;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (a[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        System.out.println(lo);
    }
}`,
      },
    ],
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    titleKo: "투 포인터",
    category: "search",
    tags: ["search", "array"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "6\n1 2 4 5 7 11\n13",
        code: `import sys

input = sys.stdin.readline

def main():
  n = int(input())
  a = list(map(int, input().split()))
  t = int(input())
  i, j = 0, n - 1
  while i < j:
    s = a[i] + a[j]
    if s == t:
      print(a[i], a[j])
      return
    if s < t:
      i += 1
    else:
      j -= 1
  print(-1)

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "6\n1 2 4 5 7 11\n13",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  const n = parseInt(lines[0], 10);
  const a = lines[1].trim().split(/\\s+/).map((x) => parseInt(x, 10));
  const t = parseInt(lines[2], 10);
  let i = 0;
  let j = n - 1;
  while (i < j) {
    const s = a[i] + a[j];
    if (s === t) {
      console.log(\`\${a[i]} \${a[j]}\`);
      return;
    }
    if (s < t) i++;
    else j--;
  }
  console.log(-1);
}

main();`,
      },
      {
        language: "java",
        stdin: "6\n1 2 4 5 7 11\n13",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int t = sc.nextInt();
        int i = 0, j = n - 1;
        while (i < j) {
            int s = a[i] + a[j];
            if (s == t) {
                System.out.println(a[i] + " " + a[j]);
                return;
            }
            if (s < t) i++;
            else j--;
        }
        System.out.println(-1);
    }
}`,
      },
    ],
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    titleKo: "슬라이딩 윈도우",
    category: "search",
    tags: ["search", "array"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "4 2\n3 1 5 2",
        code: `import sys

input = sys.stdin.readline

def main():
  n, k = map(int, input().split())
  a = list(map(int, input().split()))
  cur = sum(a[:k])
  best = cur
  for i in range(k, n):
    cur += a[i] - a[i - k]
    best = max(best, cur)
  print(best)

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "4 2\n3 1 5 2",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  const [n, k] = lines[0].trim().split(/\\s+/).map(Number);
  const a = lines[1].trim().split(/\\s+/).map((x) => parseInt(x, 10));
  let cur = 0;
  for (let i = 0; i < k; i++) cur += a[i];
  let best = cur;
  for (let i = k; i < n; i++) {
    cur += a[i] - a[i - k];
    if (cur > best) best = cur;
  }
  console.log(best);
}

main();`,
      },
      {
        language: "java",
        stdin: "4 2\n3 1 5 2",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), k = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int cur = 0;
        for (int i = 0; i < k; i++) cur += a[i];
        int best = cur;
        for (int i = k; i < n; i++) {
            cur += a[i] - a[i - k];
            if (cur > best) best = cur;
        }
        System.out.println(best);
    }
}`,
      },
    ],
  },

  // ── Data Structure ───────────────────────────────────────────────────────
  {
    id: "stack",
    title: "Stack",
    titleKo: "스택",
    category: "data-structure",
    tags: ["data-structure", "stack"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "6\npush 1\npush 2\npop\npush 3\npop\npop",
        code: `import sys

input = sys.stdin.readline

def main():
  q = int(input())
  s = []
  out = []
  for _ in range(q):
    parts = input().split()
    if parts[0] == "push":
      s.append(int(parts[1]))
    else:
      out.append(str(s.pop()))
  sys.stdout.write("\\n".join(out))

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "6\npush 1\npush 2\npop\npush 3\npop\npop",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  let i = 0;
  const q = parseInt(lines[i++], 10);
  const s = [];
  const out = [];
  for (let k = 0; k < q; k++) {
    const parts = lines[i++].trim().split(/\\s+/);
    if (parts[0] === 'push') {
      s.push(parseInt(parts[1], 10));
    } else {
      out.push(String(s.pop()));
    }
  }
  console.log(out.join('\\n'));
}

main();`,
      },
      {
        language: "java",
        stdin: "6\npush 1\npush 2\npop\npush 3\npop\npop",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int q = sc.nextInt();
        sc.nextLine();
        Deque<Integer> s = new ArrayDeque<>();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < q; i++) {
            String line = sc.nextLine().trim();
            if (line.startsWith("push")) {
                s.push(Integer.parseInt(line.split(" ")[1]));
            } else {
                if (sb.length() > 0) sb.append('\\n');
                sb.append(s.pop());
            }
        }
        System.out.print(sb);
    }
}`,
      },
    ],
  },
  {
    id: "queue",
    title: "Queue",
    titleKo: "큐",
    category: "data-structure",
    tags: ["data-structure", "queue"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "5\npush 1\npush 2\npop\npush 3\npop",
        code: `import sys
from collections import deque

input = sys.stdin.readline

def main():
  q = int(input())
  dq = deque()
  out = []
  for _ in range(q):
    parts = input().split()
    if parts[0] == "push":
      dq.append(int(parts[1]))
    else:
      out.append(str(dq.popleft()))
  sys.stdout.write("\\n".join(out))

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "5\npush 1\npush 2\npop\npush 3\npop",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  let i = 0;
  const q = parseInt(lines[i++], 10);
  const dq = [];
  const out = [];
  for (let k = 0; k < q; k++) {
    const parts = lines[i++].trim().split(/\\s+/);
    if (parts[0] === 'push') {
      dq.push(parseInt(parts[1], 10));
    } else {
      out.push(String(dq.shift()));
    }
  }
  console.log(out.join('\\n'));
}

main();`,
      },
      {
        language: "java",
        stdin: "5\npush 1\npush 2\npop\npush 3\npop",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int q = sc.nextInt();
        sc.nextLine();
        Deque<Integer> dq = new ArrayDeque<>();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < q; i++) {
            String line = sc.nextLine().trim();
            if (line.startsWith("push")) {
                dq.offer(Integer.parseInt(line.split(" ")[1]));
            } else {
                if (sb.length() > 0) sb.append('\\n');
                sb.append(dq.poll());
            }
        }
        System.out.print(sb);
    }
}`,
      },
    ],
  },
  {
    id: "priority-queue",
    title: "Priority Queue",
    titleKo: "우선순위 큐",
    category: "data-structure",
    tags: ["data-structure", "heap"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "3\n3 1 2",
        code: `import heapq
import sys

input = sys.stdin.readline

def main():
  n = int(input())
  a = list(map(int, input().split()))
  heapq.heapify(a)
  out = []
  while a:
    out.append(str(heapq.heappop(a)))
  print(' '.join(out))

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "3\n3 1 2",
        code: `const fs = require('fs');

class MinHeap {
  constructor() {
    this.a = [];
  }
  push(x) {
    this.a.push(x);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p] <= this.a[i]) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    if (a.length === 0) return undefined;
    const v = a[0];
    const last = a.pop();
    if (a.length === 0) return v;
    a[0] = last;
    let i = 0;
    for (;;) {
      const l = i * 2 + 1;
      const r = l + 1;
      let m = i;
      if (l < a.length && a[l] < a[m]) m = l;
      if (r < a.length && a[r] < a[m]) m = r;
      if (m === i) break;
      [a[i], a[m]] = [a[m], a[i]];
      i = m;
    }
    return v;
  }
  get empty() {
    return this.a.length === 0;
  }
}

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  const n = parseInt(lines[0], 10);
  const nums = lines[1].trim().split(/\\s+/).map((x) => parseInt(x, 10));
  const h = new MinHeap();
  for (let i = 0; i < n; i++) h.push(nums[i]);
  const out = [];
  while (!h.empty) out.push(String(h.pop()));
  console.log(out.join(' '));
}

main();`,
      },
      {
        language: "java",
        stdin: "3\n3 1 2",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int i = 0; i < n; i++) pq.offer(sc.nextInt());
        StringBuilder sb = new StringBuilder();
        while (!pq.isEmpty()) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(pq.poll());
        }
        System.out.println(sb);
    }
}`,
      },
    ],
  },

  // ── Graph ────────────────────────────────────────────────────────────────
  {
    id: "bfs",
    title: "BFS",
    titleKo: "너비 우선 탐색",
    category: "graph",
    tags: ["graph", "traversal"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "3 3 0\n0 1\n0 2\n1 2",
        code: `import sys
from collections import deque

input = sys.stdin.readline

def main():
  n, m, st = map(int, input().split())
  g = [[] for _ in range(n)]
  for _ in range(m):
    a, b = map(int, input().split())
    g[a].append(b)
    g[b].append(a)
  for row in g:
    row.sort()
  seen = [False] * n
  q = deque([st])
  seen[st] = True
  out = []
  while q:
    u = q.popleft()
    out.append(u)
    for v in g[u]:
      if not seen[v]:
        seen[v] = True
        q.append(v)
  print(*out)

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "3 3 0\n0 1\n0 2\n1 2",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  let i = 0;
  const [n, m, st] = lines[i++].split(/\\s+/).map(Number);
  const g = Array.from({ length: n }, () => []);
  for (let k = 0; k < m; k++) {
    const [a, b] = lines[i++].split(/\\s+/).map(Number);
    g[a].push(b);
    g[b].push(a);
  }
  for (const row of g) row.sort((x, y) => x - y);
  const seen = Array(n).fill(false);
  const q = [st];
  seen[st] = true;
  const out = [];
  while (q.length) {
    const u = q.shift();
    out.push(u);
    for (const v of g[u]) {
      if (!seen[v]) {
        seen[v] = true;
        q.push(v);
      }
    }
  }
  console.log(out.join(' '));
}

main();`,
      },
      {
        language: "java",
        stdin: "3 3 0\n0 1\n0 2\n1 2",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt(), st = sc.nextInt();
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            g.get(a).add(b);
            g.get(b).add(a);
        }
        for (List<Integer> row : g) Collections.sort(row);
        boolean[] seen = new boolean[n];
        Deque<Integer> q = new ArrayDeque<>();
        q.offer(st);
        seen[st] = true;
        StringBuilder sb = new StringBuilder();
        while (!q.isEmpty()) {
            int u = q.poll();
            if (sb.length() > 0) sb.append(' ');
            sb.append(u);
            for (int v : g.get(u)) {
                if (!seen[v]) {
                    seen[v] = true;
                    q.offer(v);
                }
            }
        }
        System.out.println(sb);
    }
}`,
      },
    ],
  },
  {
    id: "dfs",
    title: "DFS",
    titleKo: "깊이 우선 탐색",
    category: "graph",
    tags: ["graph", "traversal"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "3 3 0\n0 1\n0 2\n1 2",
        code: `import sys

input = sys.stdin.readline
sys.setrecursionlimit(1_000_000)

def main():
  n, m, st = map(int, input().split())
  g = [[] for _ in range(n)]
  for _ in range(m):
    a, b = map(int, input().split())
    g[a].append(b)
    g[b].append(a)
  for row in g:
    row.sort()
  seen = [False] * n
  out = []

  def dfs(u):
    seen[u] = True
    out.append(u)
    for v in g[u]:
      if not seen[v]:
        dfs(v)

  dfs(st)
  print(*out)

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "3 3 0\n0 1\n0 2\n1 2",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  let i = 0;
  const [n, m, st] = lines[i++].split(/\\s+/).map(Number);
  const g = Array.from({ length: n }, () => []);
  for (let k = 0; k < m; k++) {
    const [a, b] = lines[i++].split(/\\s+/).map(Number);
    g[a].push(b);
    g[b].push(a);
  }
  for (const row of g) row.sort((x, y) => x - y);
  const seen = Array(n).fill(false);
  const out = [];
  function dfs(u) {
    seen[u] = true;
    out.push(u);
    for (const v of g[u]) {
      if (!seen[v]) dfs(v);
    }
  }
  dfs(st);
  console.log(out.join(' '));
}

main();`,
      },
      {
        language: "java",
        stdin: "3 3 0\n0 1\n0 2\n1 2",
        code: `import java.util.*;

public class Main {
    static List<List<Integer>> g;
    static boolean[] seen;
    static StringBuilder sb = new StringBuilder();

    static void dfs(int u) {
        seen[u] = true;
        if (sb.length() > 0) sb.append(' ');
        sb.append(u);
        for (int v : g.get(u)) {
            if (!seen[v]) dfs(v);
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt(), st = sc.nextInt();
        g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            g.get(a).add(b);
            g.get(b).add(a);
        }
        for (List<Integer> row : g) Collections.sort(row);
        seen = new boolean[n];
        dfs(st);
        System.out.println(sb);
    }
}`,
      },
    ],
  },
  {
    id: "dijkstra",
    title: "Dijkstra",
    titleKo: "다익스트라",
    category: "graph",
    tags: ["graph", "shortest-path"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "3 0 1 3\n0 1 4\n0 2 1\n2 1 2",
        code: `import heapq
import sys

input = sys.stdin.readline

def main():
  n, s, t, m = map(int, input().split())
  g = [[] for _ in range(n)]
  for _ in range(m):
    u, v, w = map(int, input().split())
    g[u].append((v, w))
  INF = 10**9
  d = [INF] * n
  d[s] = 0
  pq = [(0, s)]
  while pq:
    du, u = heapq.heappop(pq)
    if du != d[u]:
      continue
    for v, w in g[u]:
      if du + w < d[v]:
        d[v] = du + w
        heapq.heappush(pq, (d[v], v))
  print(d[t])

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "3 0 1 3\n0 1 4\n0 2 1\n2 1 2",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  let i = 0;
  const [n, s, t, m] = lines[i++].split(/\\s+/).map(Number);
  const g = Array.from({ length: n }, () => []);
  for (let k = 0; k < m; k++) {
    const [u, v, w] = lines[i++].split(/\\s+/).map(Number);
    g[u].push([v, w]);
  }
  const INF = 1e9;
  const d = Array(n).fill(INF);
  d[s] = 0;
  const pq = [[0, s]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [du, u] = pq.shift();
    if (du !== d[u]) continue;
    for (const [v, w] of g[u]) {
      if (du + w < d[v]) {
        d[v] = du + w;
        pq.push([d[v], v]);
      }
    }
  }
  console.log(d[t]);
}

main();`,
      },
      {
        language: "java",
        stdin: "3 0 1 3\n0 1 4\n0 2 1\n2 1 2",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), s = sc.nextInt(), t = sc.nextInt(), m = sc.nextInt();
        List<List<int[]>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int u = sc.nextInt(), v = sc.nextInt(), w = sc.nextInt();
            g.get(u).add(new int[]{v, w});
        }
        int[] d = new int[n];
        Arrays.fill(d, Integer.MAX_VALUE);
        d[s] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(x -> x[0]));
        pq.offer(new int[]{0, s});
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int du = cur[0], u = cur[1];
            if (du != d[u]) continue;
            for (int[] e : g.get(u)) {
                int v = e[0], w = e[1];
                if (du + w < d[v]) {
                    d[v] = du + w;
                    pq.offer(new int[]{d[v], v});
                }
            }
        }
        System.out.println(d[t]);
    }
}`,
      },
    ],
  },
  {
    id: "union-find",
    title: "Union-Find",
    titleKo: "유니온 파인드",
    category: "graph",
    tags: ["graph", "disjoint-set"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "3 2\n0 1\n1 2",
        code: `import sys

input = sys.stdin.readline

def main():
  n, m = map(int, input().split())
  p = list(range(n))

  def find(x):
    if p[x] != x:
      p[x] = find(p[x])
    return p[x]

  def union(a, b):
    ra, rb = find(a), find(b)
    if ra != rb:
      p[ra] = rb

  for _ in range(m):
    a, b = map(int, input().split())
    union(a, b)
  print(1 if find(0) == find(n - 1) else 0)

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "3 2\n0 1\n1 2",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  let i = 0;
  const [n, m] = lines[i++].split(/\\s+/).map(Number);
  const p = Array.from({ length: n }, (_, k) => k);
  function find(x) {
    if (p[x] !== x) p[x] = find(p[x]);
    return p[x];
  }
  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) p[ra] = rb;
  }
  for (let k = 0; k < m; k++) {
    const [a, b] = lines[i++].split(/\\s+/).map(Number);
    union(a, b);
  }
  console.log(find(0) === find(n - 1) ? 1 : 0);
}

main();`,
      },
      {
        language: "java",
        stdin: "3 2\n0 1\n1 2",
        code: `import java.util.*;

public class Main {
    static int[] p;

    static int find(int x) {
        if (p[x] != x) p[x] = find(p[x]);
        return p[x];
    }

    static void union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra != rb) p[ra] = rb;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt();
        p = new int[n];
        for (int i = 0; i < n; i++) p[i] = i;
        for (int i = 0; i < m; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            union(a, b);
        }
        System.out.println(find(0) == find(n - 1) ? 1 : 0);
    }
}`,
      },
    ],
  },

  // ── DP ───────────────────────────────────────────────────────────────────
  {
    id: "fibonacci",
    title: "Fibonacci (DP)",
    titleKo: "피보나치 (DP)",
    category: "dp",
    tags: ["dp", "memoization"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "10",
        code: `import sys
input = sys.stdin.readline

def main():
  n = int(input())
  if n == 0:
    print(0)
    return
  dp = [0] * (n + 1)
  dp[1] = 1
  for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]
  print(dp[n])

main()`,
      },
      {
        language: "javascript",
        stdin: "10",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

const n = parseInt(lines[0]);
if (n === 0) {
  console.log(0);
} else {
  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  console.log(dp[n]);
}`,
      },
      {
        language: "java",
        stdin: "10",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (n == 0) {
            System.out.println(0);
            return;
        }
        int[] dp = new int[n + 1];
        dp[1] = 1;
        for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
        System.out.println(dp[n]);
    }
}`,
      },
    ],
  },
  {
    id: "knapsack-01",
    title: "0/1 Knapsack",
    titleKo: "0/1 배낭",
    category: "dp",
    tags: ["dp", "2d-table"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "4 5\n2 3\n3 4\n4 5\n5 6",
        code: `import sys
input = sys.stdin.readline

def main():
  n, W = map(int, input().split())
  items = [tuple(map(int, input().split())) for _ in range(n)]
  dp = [0] * (W + 1)
  for w, v in items:
    for c in range(W, w - 1, -1):
      dp[c] = max(dp[c], dp[c - w] + v)
  print(dp[W])

main()`,
      },
      {
        language: "javascript",
        stdin: "4 5\n2 3\n3 4\n4 5\n5 6",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

const [n, W] = lines[0].split(' ').map(Number);
const dp = new Array(W + 1).fill(0);
for (let i = 1; i <= n; i++) {
  const [w, v] = lines[i].split(' ').map(Number);
  for (let c = W; c >= w; c--) {
    dp[c] = Math.max(dp[c], dp[c - w] + v);
  }
}
console.log(dp[W]);`,
      },
      {
        language: "java",
        stdin: "4 5\n2 3\n3 4\n4 5\n5 6",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), W = sc.nextInt();
        int[] dp = new int[W + 1];
        for (int i = 0; i < n; i++) {
            int w = sc.nextInt(), v = sc.nextInt();
            for (int c = W; c >= w; c--) {
                dp[c] = Math.max(dp[c], dp[c - w] + v);
            }
        }
        System.out.println(dp[W]);
    }
}`,
      },
    ],
  },
  {
    id: "lcs",
    title: "LCS",
    titleKo: "최장 공통 부분수열",
    category: "dp",
    tags: ["dp", "2d-table"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "ABCBDAB\nBDCAB",
        code: `import sys
input = sys.stdin.readline

def main():
  a = input().strip()
  b = input().strip()
  m, n = len(a), len(b)
  dp = [[0] * (n + 1) for _ in range(m + 1)]
  for i in range(1, m + 1):
    for j in range(1, n + 1):
      if a[i - 1] == b[j - 1]:
        dp[i][j] = dp[i - 1][j - 1] + 1
      else:
        dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
  print(dp[m][n])

main()`,
      },
      {
        language: "javascript",
        stdin: "ABCBDAB\nBDCAB",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

const a = lines[0];
const b = lines[1];
const m = a.length, n = b.length;
const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
for (let i = 1; i <= m; i++) {
  for (let j = 1; j <= n; j++) {
    if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
    else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
  }
}
console.log(dp[m][n]);`,
      },
      {
        language: "java",
        stdin: "ABCBDAB\nBDCAB",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String a = sc.next(), b = sc.next();
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        System.out.println(dp[m][n]);
    }
}`,
      },
    ],
  },
  {
    id: "prefix-sum",
    title: "Prefix Sum",
    titleKo: "누적합",
    category: "search",
    tags: ["array", "prefix-sum"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "5\n2 1 3 0 4\n1\n1 3",
        code: `import sys

input = sys.stdin.readline

def main():
  n = int(input())
  a = list(map(int, input().split()))
  ps = [0] * (n + 1)
  for i in range(n):
    ps[i + 1] = ps[i] + a[i]
  q = int(input())
  out = []
  for _ in range(q):
    l, r = map(int, input().split())
    out.append(str(ps[r] - ps[l - 1]))
  sys.stdout.write("\\n".join(out))

if __name__ == "__main__":
  main()`,
      },
      {
        language: "javascript",
        stdin: "5\n2 1 3 0 4\n1\n1 3",
        code: `const fs = require('fs');

function main() {
  const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');
  let i = 0;
  const n = parseInt(lines[i++], 10);
  const a = lines[i++].trim().split(/\\s+/).map((x) => parseInt(x, 10));
  const ps = new Array(n + 1).fill(0);
  for (let j = 0; j < n; j++) ps[j + 1] = ps[j] + a[j];
  const q = parseInt(lines[i++], 10);
  const out = [];
  for (let k = 0; k < q; k++) {
    const [l, r] = lines[i++].trim().split(/\\s+/).map(Number);
    out.push(String(ps[r] - ps[l - 1]));
  }
  console.log(out.join('\\n'));
}

main();`,
      },
      {
        language: "java",
        stdin: "5\n2 1 3 0 4\n1\n1 3",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] ps = new int[n + 1];
        for (int i = 1; i <= n; i++) ps[i] = ps[i - 1] + sc.nextInt();
        int q = sc.nextInt();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < q; i++) {
            int l = sc.nextInt(), r = sc.nextInt();
            if (i > 0) sb.append('\\n');
            sb.append(ps[r] - ps[l - 1]);
        }
        System.out.print(sb);
    }
}`,
      },
    ],
  },

  // ── Recursion ────────────────────────────────────────────────────────────
  {
    id: "factorial",
    title: "Factorial",
    titleKo: "팩토리얼",
    category: "recursion",
    tags: ["recursion", "call-stack"],
    difficulty: "easy",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "5",
        code: `import sys
input = sys.stdin.readline

def factorial(n):
  if n <= 1:
    return 1
  return n * factorial(n - 1)

n = int(input())
print(factorial(n))`,
      },
      {
        language: "javascript",
        stdin: "5",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

const n = parseInt(lines[0]);
console.log(factorial(n));`,
      },
      {
        language: "java",
        stdin: "5",
        code: `import java.util.*;

public class Main {
    static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(factorial(n));
    }
}`,
      },
    ],
  },
  {
    id: "tower-of-hanoi",
    title: "Tower of Hanoi",
    titleKo: "하노이의 탑",
    category: "recursion",
    tags: ["recursion", "divide-and-conquer"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "3",
        code: `import sys
input = sys.stdin.readline

def hanoi(n, src, dst, tmp):
  if n == 0:
    return
  hanoi(n - 1, src, tmp, dst)
  print(src, "->", dst)
  hanoi(n - 1, tmp, dst, src)

n = int(input())
hanoi(n, "A", "C", "B")`,
      },
      {
        language: "javascript",
        stdin: "3",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

function hanoi(n, src, dst, tmp) {
  if (n === 0) return;
  hanoi(n - 1, src, tmp, dst);
  console.log(src + ' -> ' + dst);
  hanoi(n - 1, tmp, dst, src);
}

const n = parseInt(lines[0]);
hanoi(n, 'A', 'C', 'B');`,
      },
      {
        language: "java",
        stdin: "3",
        code: `import java.util.*;

public class Main {
    static void hanoi(int n, String src, String dst, String tmp) {
        if (n == 0) return;
        hanoi(n - 1, src, tmp, dst);
        System.out.println(src + " -> " + dst);
        hanoi(n - 1, tmp, dst, src);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        hanoi(n, "A", "C", "B");
    }
}`,
      },
    ],
  },
  {
    id: "n-queens",
    title: "N-Queens (4×4)",
    titleKo: "N-Queens (4×4)",
    category: "recursion",
    tags: ["recursion", "backtracking"],
    difficulty: "medium",
    featured: true,
    variants: [
      {
        language: "python",
        stdin: "4",
        code: `import sys
input = sys.stdin.readline

def solve(n):
  cols = [0] * n
  cnt = 0

  def safe(r, c):
    for i in range(r):
      if cols[i] == c or abs(cols[i] - c) == r - i:
        return False
    return True

  def bt(r):
    nonlocal cnt
    if r == n:
      cnt += 1
      print(*cols[:n])
      return
    for c in range(n):
      if safe(r, c):
        cols[r] = c
        bt(r + 1)

  bt(0)
  print(cnt)

n = int(input())
solve(n)`,
      },
      {
        language: "javascript",
        stdin: "4",
        code: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');

function solve(n) {
  const cols = new Array(n).fill(0);
  let cnt = 0;

  function safe(r, c) {
    for (let i = 0; i < r; i++) {
      if (cols[i] === c || Math.abs(cols[i] - c) === r - i) return false;
    }
    return true;
  }

  function bt(r) {
    if (r === n) {
      cnt++;
      console.log(cols.slice(0, n).join(' '));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (safe(r, c)) {
        cols[r] = c;
        bt(r + 1);
      }
    }
  }

  bt(0);
  console.log(cnt);
}

const n = parseInt(lines[0]);
solve(n);`,
      },
      {
        language: "java",
        stdin: "4",
        code: `import java.util.*;

public class Main {
    static int n;
    static int[] cols;
    static int cnt = 0;

    static boolean safe(int r, int c) {
        for (int i = 0; i < r; i++) {
            if (cols[i] == c || Math.abs(cols[i] - c) == r - i) return false;
        }
        return true;
    }

    static void bt(int r) {
        if (r == n) {
            cnt++;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                if (i > 0) sb.append(' ');
                sb.append(cols[i]);
            }
            System.out.println(sb);
            return;
        }
        for (int c = 0; c < n; c++) {
            if (safe(r, c)) {
                cols[r] = c;
                bt(r + 1);
            }
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        n = sc.nextInt();
        cols = new int[n];
        bt(0);
        System.out.println(cnt);
    }
}`,
      },
    ],
  },
];
