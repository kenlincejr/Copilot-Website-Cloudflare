# -*- coding: utf-8 -*-
import io

p = "assets/app.js"
s = io.open(p, encoding="utf-8").read()


def sub(old, new):
    global s
    assert old in s, "NOT FOUND:\n" + old[:200]
    s = s.replace(old, new)


OLD_SPLIT = "\n".join([
    "  split: {",
    '    short: "SPLIT", label: "How far the two ADP sources disagree", w: "56px",',
    '    desc: "The main ADP minus Sleeper\'s. A big number means the two markets disagree about " +',
    '          "him, which is worth a look \\u2014 but it is not automatically an edge. Josh Jacobs " +',
    '          "splits by 31 picks purely because Sleeper had not absorbed his move to the " +',
    '          "exempt list. Treat a wide split as a question, not an answer.",',
    "    render: function (p) {",
    '      if (!p.adp2) return { v: "\\u2014", cls: "dimtext" };',
    "      var d = Math.round(p.adp - p.adp2);",
    '      if (Math.abs(d) < 8) return { v: "\\u2014", cls: "dimtext" };',
    '      return { v: (d > 0 ? "+" : "") + d,',
    '               style: "color:" + (Math.abs(d) >= 18 ? "var(--amber)" : "var(--muted)") };',
    "    }",
    "  },",
]) + "\n"

NEW_SPLIT = "\n".join([
    "  split: {",
    '    short: "SPLIT", label: "Where the other market disagrees", w: "56px",',
    '    desc: "How far Sleeper\'s ADP sits from where players of this board ADP normally sit " +',
    '          "on Sleeper. Negative means the other market is higher on him than his peers, " +',
    '          "positive means lower. It is a de-drifted residual rather than a raw difference: " +',
    '          "Sleeper ranks about 2,150 players against this board\'s 267, so the two lists " +',
    '          "pull apart with depth for reasons that have nothing to do with anyone\'s " +',
    '          "opinion, and subtracting them directly would flag most of the late rounds. Even " +',
    '          "corrected, a wide split is a question rather than an answer \\u2014 Josh Jacobs " +',
    '          "reads as a bargain over there purely because Sleeper has not absorbed his move " +',
    '          "to the exempt list.",',
    "    render: function (p) {",
    '      if (p.adpResid == null) return { v: "\\u2014", cls: "dimtext" };',
    "      var d = Math.round(p.adpResid);",
    '      if (Math.abs(d) < 12) return { v: "\\u2014", cls: "dimtext" };',
    '      return { v: (d > 0 ? "+" : "") + d,',
    '               style: "color:" + (Math.abs(d) >= 30 ? "var(--amber)" : "var(--muted)") };',
    "    }",
    "  },",
]) + "\n"

sub(OLD_SPLIT, NEW_SPLIT)

sub('''    if (p.adp2 && Math.abs(p.adp - p.adp2) >= 12) {
      extra.push("ADP sources split: " + p.adp + " here vs " + p.adp2 + " on Sleeper");
    }''',
'''    if (p.adpResid != null && Math.abs(p.adpResid) >= 25) {
      extra.push("the other ADP market is " + Math.abs(Math.round(p.adpResid)) + " picks " +
        (p.adpResid < 0 ? "higher" : "lower") + " on him than players of his price here");
    }''')

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("split column + claude context now use the residual")
