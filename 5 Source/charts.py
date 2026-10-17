"""Chart images for case files and the deck. Black-and-white safe: every segment
has its own fill pattern, marker, and line style, not just a color."""
import json, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "charts")
os.makedirs(OUT, exist_ok=True)
data = json.load(open(os.path.join(ROOT, "data.json")))

BROWN, ORANGE, GREY, INK = "#4C3629", "#E26F39", "#B9AFA8", "#2B2B2B"
STY = [dict(color=BROWN, hatch="", marker="o", ls="-"),
       dict(color=ORANGE, hatch="////", marker="s", ls="--"),
       dict(color=GREY, hatch="....", marker="^", ls=":")]
fam = "Liberation Sans" if any("Liberation Sans" in f.name for f in font_manager.fontManager.ttflist) else "DejaVu Sans"
plt.rcParams.update({"font.family": fam, "font.size": 9, "axes.edgecolor": "#888",
                     "axes.labelcolor": INK, "xtick.color": INK, "ytick.color": INK,
                     "hatch.linewidth": 0.8, "hatch.color": "white"})

def money(v):
    return f"${v:,.0f}" if float(v).is_integer() else f"${v:,.2f}"

def feature_chart(co, path):
    feats = co["feats"][::-1]
    n = len(feats)
    fig, ax = plt.subplots(figsize=(7.2, 4.9), dpi=200)
    h = 0.26
    for si in range(3):
        st = STY[si]
        ys = [i + (1 - si) * h for i in range(n)]
        vals = [f["pct"][si] for f in feats]
        bars = ax.barh(ys, vals, height=h, color=st["color"], edgecolor=st["color"] if si != 2 else "#7a706a",
                       hatch=st["hatch"], linewidth=0.6, label=f"Segment {'ABC'[si]}")
        for y, v in zip(ys, vals):
            ax.text(v + 0.8, y, f"{v}%", va="center", fontsize=7, color=INK)
    for x, lab in [(30, "nice-to-have line"), (60, "must-have line")]:
        ax.axvline(x, color="#555", ls=(0, (3, 3)), lw=0.9, zorder=0)
        ax.text(x + 0.8, n - 0.48, lab, fontsize=7, color="#555", va="bottom", style="italic")
    ax.set_yticks(range(n))
    ax.set_yticklabels([f["name"] for f in feats], fontsize=8.5)
    ax.set_xlim(0, 100)
    ax.set_xticks([0, 20, 40, 60, 80, 100])
    ax.set_xticklabels([f"{t}%" for t in [0, 20, 40, 60, 80, 100]])
    ax.set_xlabel("% of segment who said \"I would only buy it if it had this\"")
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    ax.legend(loc="upper center", bbox_to_anchor=(0.42, -0.11), ncol=3, frameon=False, fontsize=8.5)
    ax.set_ylim(-0.6, n - 0.15)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)

def wtp_chart(co, path):
    fig, ax = plt.subplots(figsize=(7.2, 3.3), dpi=200)
    xs = list(range(len(co["prices"])))
    for si, seg in enumerate(co["segs"]):
        st = STY[si]
        ax.plot(xs, seg["wtp"], color=st["color"] if si != 2 else "#8a7f78", ls=st["ls"], marker=st["marker"],
                lw=2, ms=6, label=f"Segment {'ABC'[si]}", markerfacecolor=st["color"] if si != 2 else "white",
                markeredgecolor="#4C3629" if si == 2 else st["color"])
    ax.set_xticks(xs)
    ax.set_xticklabels([money(p) for p in co["prices"]])
    ax.set_ylim(0, 100)
    ax.set_yticks([0, 25, 50, 75, 100])
    ax.set_yticklabels(["0%", "25%", "50%", "75%", "100%"])
    ax.set_xlabel(f"Price ({co['unit']})")
    ax.set_ylabel("% who would buy")
    ax.grid(axis="y", color="#ddd", lw=0.6)
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.2), ncol=3, frameon=False, fontsize=8.5)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)

if __name__ == "__main__":
    for co in data["companies"] + [data["maya"]]:
        feature_chart(co, os.path.join(OUT, f"{co['id']}_features.png"))
        wtp_chart(co, os.path.join(OUT, f"{co['id']}_wtp.png"))
    print("charts:", len(os.listdir(OUT)))
