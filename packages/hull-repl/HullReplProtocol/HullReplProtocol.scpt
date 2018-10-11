on open location hullReplURL
  tell application "iTerm"
    tell current window
      create tab with default profile
      tell current session
        write text "hull-repl --url \"" & hullReplURL & "\""
      end tell
    end tell
  end tell
end open location
