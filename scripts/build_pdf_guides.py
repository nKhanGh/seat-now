"""Build the Vietnamese SeatNow guides as portable PDFs.

Run with a Python environment containing reportlab:
    python scripts/build_pdf_guides.py
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
GREEN = colors.HexColor("#17654d")
DARK = colors.HexColor("#152520")
MUTED = colors.HexColor("#52645b")
PALE = colors.HexColor("#f1f7f2")
LINE = colors.HexColor("#d8e7dd")
PAGE_WIDTH, PAGE_HEIGHT = A4
CONTENT_WIDTH = PAGE_WIDTH - 104


def register_fonts() -> None:
    candidates = [
        (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf"), Path("C:/Windows/Fonts/ariali.ttf")),
        (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf")),
    ]
    font_paths = next((paths for paths in candidates if all(path.exists() for path in paths)), None)
    if font_paths is None:
        raise FileNotFoundError("Arial or DejaVu Sans Unicode TTF fonts are required")
    fonts = dict(zip(("SeatNow", "SeatNow-Bold", "SeatNow-Italic"), font_paths))
    for name, path in fonts.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily(
        "SeatNow", normal="SeatNow", bold="SeatNow-Bold", italic="SeatNow-Italic"
    )


def styles() -> dict[str, ParagraphStyle]:
    base = ParagraphStyle(
        "body", fontName="SeatNow", fontSize=9.2, leading=13.5,
        textColor=DARK, spaceAfter=6, allowWidows=0, allowOrphans=0,
    )
    return {
        "body": base,
        "title": ParagraphStyle(
            "title", parent=base, fontName="SeatNow-Bold", fontSize=22,
            leading=27, textColor=GREEN, spaceAfter=9,
        ),
        "h2": ParagraphStyle(
            "h2", parent=base, fontName="SeatNow-Bold", fontSize=14,
            leading=18, textColor=GREEN, spaceBefore=14, spaceAfter=6,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "h3", parent=base, fontName="SeatNow-Bold", fontSize=11,
            leading=15, spaceBefore=9, spaceAfter=4, keepWithNext=True,
        ),
        "h4": ParagraphStyle(
            "h4", parent=base, fontName="SeatNow-Bold", fontSize=9.5,
            leading=14, spaceBefore=7, keepWithNext=True,
        ),
        "list": ParagraphStyle(
            "list", parent=base, leftIndent=17, firstLineIndent=-13,
            spaceAfter=3,
        ),
        "table": ParagraphStyle(
            "table", parent=base, fontSize=8.2, leading=11.5, spaceAfter=0,
        ),
        "table-head": ParagraphStyle(
            "table-head", parent=base, fontName="SeatNow-Bold", fontSize=8.2,
            leading=11.5, textColor=GREEN, spaceAfter=0,
        ),
        "code": ParagraphStyle(
            "code", parent=base, fontSize=8, leading=11.5, spaceAfter=0,
            wordWrap="CJK",
        ),
        "subtitle": ParagraphStyle(
            "subtitle", parent=base, fontSize=9, leading=13,
            textColor=MUTED, spaceAfter=12,
        ),
    }


TOKEN = re.compile(r"(\*\*[^*]+\*\*|`[^`]+`|\[[^]]+\]\([^)]+\))")


def inline_markup(value: str) -> str:
    parts: list[str] = []
    for part in TOKEN.split(value):
        if part.startswith("**") and part.endswith("**"):
            parts.append(f"<b>{html.escape(part[2:-2])}</b>")
        elif part.startswith("`") and part.endswith("`"):
            parts.append(f'<font color="#17654d">{html.escape(part[1:-1])}</font>')
        elif part.startswith("[") and "](" in part and part.endswith(")"):
            label, url = part[1:-1].split("](", 1)
            if url.startswith("https://"):
                parts.append(f'<link href="{html.escape(url, quote=True)}" color="#17654d">{html.escape(label)}</link>')
            else:
                parts.append(html.escape(label))
        else:
            parts.append(html.escape(part))
    return "".join(parts)


def parse_table(lines: list[str], style: dict[str, ParagraphStyle]) -> Table:
    rows = [[cell.strip() for cell in line.strip().strip("|").split("|")] for line in lines]
    rows = [row for row in rows if not all(re.fullmatch(r":?-{2,}:?", cell) for cell in row)]
    columns = max(len(row) for row in rows)
    weights = [1.0] * columns
    if columns == 2:
        weights = [0.33, 0.67]
    elif columns == 3:
        weights = [0.23, 0.28, 0.49]
    widths = [CONTENT_WIDTH * weight / sum(weights) for weight in weights]
    data = [
        [Paragraph(inline_markup(row[index] if index < len(row) else ""), style["table-head" if row_no == 0 else "table"])
         for index in range(columns)]
        for row_no, row in enumerate(rows)
    ]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def make_story(source: Path, style: dict[str, ParagraphStyle]) -> list:
    lines = source.read_text(encoding="utf-8").splitlines()
    story: list = []
    paragraph: list[str] = []
    index = 0

    def flush() -> None:
        if paragraph:
            story.append(Paragraph(inline_markup(" ".join(paragraph)), style["body"]))
            paragraph.clear()

    while index < len(lines):
        line = lines[index].rstrip()
        stripped = line.strip()
        if not stripped:
            flush()
            index += 1
            continue
        if stripped == "<!-- PAGEBREAK -->":
            flush()
            story.append(PageBreak())
            index += 1
            continue
        if stripped.startswith("```"):
            flush()
            index += 1
            code_lines: list[str] = []
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code_lines.append(lines[index])
                index += 1
            code_rows = [[Paragraph(html.escape(code_line) or "&nbsp;", style["code"])] for code_line in code_lines]
            code = Table(code_rows, colWidths=[CONTENT_WIDTH], hAlign="LEFT")
            code.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            story.extend([Spacer(1, 5), code, Spacer(1, 9)])
            index += 1
            continue
        if stripped.startswith("|"):
            flush()
            table_lines: list[str] = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            story.extend([Spacer(1, 5), parse_table(table_lines, style), Spacer(1, 10)])
            continue
        heading = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if heading:
            flush()
            level = len(heading.group(1))
            story.append(Paragraph(inline_markup(heading.group(2)), style["title" if level == 1 else f"h{level}"]))
            if level == 1:
                story.append(HRFlowable(width="100%", thickness=1.2, color=GREEN, spaceAfter=12))
            index += 1
            continue
        bullet = re.match(r"^([-*]|\d+\.)\s+(.+)$", stripped)
        if bullet:
            flush()
            marker = "•" if bullet.group(1) in ("-", "*") else bullet.group(1)
            story.append(Paragraph(f"{marker}  {inline_markup(bullet.group(2))}", style["list"]))
            index += 1
            continue
        paragraph.append(stripped)
        index += 1
    flush()
    return story


def build(source: Path, destination: Path) -> None:
    style = styles()
    title = source.stem.replace("_", " ").title()
    document = SimpleDocTemplate(
        str(destination), pagesize=A4, rightMargin=52, leftMargin=52,
        topMargin=54, bottomMargin=54, title=f"SeatNow - {title}",
        author="SeatNow project", pageCompression=1,
    )

    def decorate(canvas, doc) -> None:
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(52, PAGE_HEIGHT - 34, PAGE_WIDTH - 52, PAGE_HEIGHT - 34)
        canvas.line(52, 38, PAGE_WIDTH - 52, 38)
        canvas.setFont("SeatNow", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(52, 25, "SeatNow  |  Tài liệu dự án học tập")
        canvas.drawRightString(PAGE_WIDTH - 52, 25, f"Trang {doc.page}")
        canvas.restoreState()

    document.build(make_story(source, style), onFirstPage=decorate, onLaterPages=decorate)


def main() -> None:
    register_fonts()
    OUT.mkdir(parents=True, exist_ok=True)
    available = ("USER_GUIDE", "DEPLOY_GUIDE", "ROLE_GUIDE")
    selected = tuple(sys.argv[1:]) or available
    unknown = set(selected) - set(available)
    if unknown:
        raise ValueError(f"Unknown guide: {', '.join(sorted(unknown))}")
    for name in selected:
        source = ROOT / "docs" / f"{name}.md"
        destination = OUT / f"seatnow-{name.lower().replace('_', '-')}.pdf"
        build(source, destination)
        print(destination)


if __name__ == "__main__":
    main()
