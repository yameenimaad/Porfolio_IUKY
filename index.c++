// index.c++ -- the same entry-point banner as index.py, index.sql, Index.php
// and Javascript.js, this time in C++17: reads the real <title> and
// <meta name="description"> out of the live index.html next to this file,
// rather than hardcoding a copy that could drift out of sync with it.
//
// Build & run:
//   g++ -std=c++17 -o index index.c++ && ./index
//
// ".c++" instead of the more common ".cpp" is a deliberate oddity to match
// this file's own name against the other five "index.<ext>" files it sits
// next to -- g++ accepts it as a C++ source extension either way.

#include <fstream>
#include <iostream>
#include <regex>
#include <sstream>
#include <string>

namespace {

std::string read_file(const std::string &path) {
    std::ifstream in(path, std::ios::binary);
    std::ostringstream ss;
    ss << in.rdbuf();
    return ss.str();
}

// A plain regex pass, not a full HTML parser -- this file has exactly one
// <title> and one <meta name="description"> near the top, and the point is
// "prove this is live data", not build a general-purpose HTML parser.
std::string extract(const std::string &html, const std::regex &pattern,
                     const std::string &fallback) {
    std::smatch match;
    if (std::regex_search(html, match, pattern) && match.size() > 1) {
        return match[1].str();
    }
    return fallback;
}

std::string unescape_amp(std::string s) {
    const std::string from = "&amp;";
    std::size_t pos = 0;
    while ((pos = s.find(from, pos)) != std::string::npos) {
        s.replace(pos, from.size(), "&");
        pos += 1;
    }
    return s;
}

}  // namespace

int main() {
    const std::string html = read_file("index.html");
    if (html.empty()) {
        std::cout << "index.html not found next to this program -- "
                     "run it from the repo root.\n";
        return 1;
    }

    const std::regex title_re(R"(<title>(.*?)</title>)");
    const std::regex desc_re(
        R"(<meta\s+name="description"\s+content="(.*?)"\s*/?>)");

    const std::string title = extract(html, title_re, "(title not found)");
    const std::string desc =
        unescape_amp(extract(html, desc_re, "(description not found)"));

    const std::size_t width = std::max<std::size_t>(title.size(), 60);
    std::cout << std::string(width, '=') << "\n"
              << title << "\n"
              << std::string(width, '=') << "\n"
              << desc << "\n\n"
              << "Read live from index.html by: index.c++ (this file)\n"
              << "Same banner, five other languages: index.py, index.sql,\n"
              << "Index.php, Javascript.js, Index.css "
                 "(a usable snippet, not a program)\n";

    return 0;
}
