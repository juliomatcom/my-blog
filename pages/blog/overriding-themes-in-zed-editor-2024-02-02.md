# Overriding themes in Zed Editor
![](/images/zed-syntax.png)
*My customized theme 'Ayu Dark' in Zed*

[Zed Editor](https://zed.dev/) is a new editor that is being developed by the same devs who built [Atom](https://atom-editor.cc/), is made in Rust and from [01/24/24](https://zed.dev/blog/zed-is-now-open-source) is an open-source project. Finally some competition for VSCode!

## Wait, another editor?
Yes, VSCode is great and have a long list of extensions to tune it to your needs, but it's also a very heavy application controlled by Microsoft (a double edged sword). Having [Electron in it's core](https://code.visualstudio.com/blogs/2022/11/28/vscode-sandbox#:~:text=Electron%20is%20the%20main%20framework,build%20cross%20platform%20desktop%20applications.) makes it slow and resource hungry. I'm a minimalist and want only the bare minimum to get my work done and I want it fast, I don't want to see my windows flickering when I open a new tab and watch my theme overrides load seconds after even with an Apple M2 Pro, at the same time I do want some basic features like intellisense, git integration or AI (copilot) to work flawless.

Zed Editor tick most of my boxes currently, it's light and fast, very fast, it's open-source now and have built-in the "tools" most of us expect out of the box (sorry SublimeText). Right now it's under heavy development so expect things to change and improve fast. Said that I'm not getting any bugs or weird issues with my tech stack (mostly ts, js, node).

## Themes needs polishing
The default themes are very low in contrast and smoky so you might have a hard time reading, or simply you want to bring your own VSCode Theme setup to Zed.
This is possible now, in this post I will show you how to make Zed Editor looks like you want it to look.

Note: As of today [theme customizing](https://zed.dev/blog/user-themes-now-in-preview) is only available in the preview version of Zed Editor. You can download the last version [here](https://zed.dev/releases/preview).

## Overriding an existing theme
I bring my own theme from VSCode and overrided the "Ayu Dark" theme in Zed Editor. This is how I did it:
1. Open the Zed Editor
2. Press CMD + Shift + P and execute 'Open settings' so you can edit the file `~/.config/zed/settings.json`
3. This is how my `settings.json` looks like:
```json
{
  "telemetry": {
    "metrics": false
  },
  "theme": "Ayu Dark",
  "experimental.theme_overrides": {
    "editor.foreground": "#dedcdc",
    "editor.background": "#0b0b0b",
    "syntax": {
      "variable": {
        "color": "#dedcdc"
      },
      "type": {
        "color": "#debac7"
      },
      "variable.special": {
        "color": "#dedcdc"
      },
      "function": {
        "color": "#f3e67e"
      },
      "keyword": {
        "color": "#ec6262"
      },
      "comment": {
        "color": "#ff9900"
      }
    }
  },
  "ui_font_size": 16,
  "buffer_font_size": 14,
  "tab_size": 2,
  "show_whitespaces": "selection",
  "language_overrides": {
    "JSON": {
      "format_on_save": "off"
    },
    "TypeScript": {
      "format_on_save": "off"
    },
    "JavaScript": {
      "format_on_save": "off"
    },
    "Markdown": {
      "show_whitespaces": "all"
    },
    "YAML": {
      "show_whitespaces": "all"
    },
    "HTML": {
      "show_whitespaces": "all"
    },
    "Python": {
      "show_whitespaces": "all"
    }
  },
  "tabs": {
    "git_status": true
  }
}
``` 
Update: get the last version from [here](https://gist.github.com/juliomatcom/fc40bab53cb01fb3286b054ebd55e5ff).
You can save and see the changes in real-time.  

- There is also a [theme importer](https://zed.dev/blog/user-themes-now-in-preview) available in work right now, so you can import your full VSCode theme.
- I extracted from [here](https://github.com/PyaeSoneAungRgn/github-zed-theme/blob/main/github-theme.json) the options I needed to change, I'll update this post when Zed website have better documentation about this.

## Adding a new theme
You can also create a new theme instead of overriding an existing one. Themes are stored in the `themes/` subdirectory under the Zed config: `~/.config/zed/themes`. Please follow the official [post](preview) to see how to create a new theme.

## Still a long way to go
These are the main issues I found so far:
- No addons or extensions market yet, this makes cool things like Minimap not available yet.
- Some parts of the UI needs polishing, like the file tree.
- Lack of documentation
- Financing is not very clear yet, we'll see how this goes.

Now that the project is open source it should move faster. Still even in the current state is working great for me and I hope this tweaks make you consider Zed Editor now.
