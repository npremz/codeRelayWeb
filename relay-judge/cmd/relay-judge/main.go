package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"code-relay/relay-judge/internal/engine"
	"code-relay/relay-judge/internal/scoring"
	"code-relay/relay-judge/internal/subject"
)

const (
	exitPassed      = 0
	exitFailed      = 1
	exitRuntime     = 2
	exitTimeout     = 3
	exitLoadError   = 4
	exitUsage       = 64
	exitInternal    = 70
	defaultPython   = "python3"
	defaultSubjects = "subjects"
	ansiReset       = "\033[0m"
	ansiBold        = "\033[1m"
	ansiRed         = "\033[31m"
	ansiGreen       = "\033[32m"
	ansiYellow      = "\033[33m"
	ansiBlue        = "\033[34m"
)

func main() {
	if len(os.Args) < 2 {
		if isInteractiveTerminal() {
			code, err := runInteractive(detectSubjectsDir(), ".", defaultPython)
			if err != nil {
				fmt.Fprintln(os.Stderr, "error:", err)
				os.Exit(exitInternal)
			}
			os.Exit(code)
		}

		printUsage()
		os.Exit(exitUsage)
	}

	switch os.Args[1] {
	case "list":
		if err := runList(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(exitInternal)
		}
	case "run":
		code, err := runJudge(os.Args[2:])
		if err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(exitInternal)
		}
		os.Exit(code)
	default:
		printUsage()
		os.Exit(exitUsage)
	}
}

func printUsage() {
	fmt.Fprintf(os.Stderr, "relay-judge <command>\n")
	fmt.Fprintf(os.Stderr, "relay-judge                # interactive mode\n\n")
	fmt.Fprintf(os.Stderr, "Commands:\n")
	fmt.Fprintf(os.Stderr, "  list   List available subjects\n")
	fmt.Fprintf(os.Stderr, "  run    Evaluate a Python submission\n")
}

func runList(args []string) error {
	fs := flag.NewFlagSet("list", flag.ContinueOnError)
	subjectsDir := fs.String("subjects-dir", detectSubjectsDir(), "Directory containing subjects")
	if err := fs.Parse(args); err != nil {
		return err
	}

	items, err := subject.Discover(*subjectsDir)
	if err != nil {
		return err
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].ID < items[j].ID
	})

	for _, item := range items {
		fmt.Printf("%s\t%s\t%s\n", item.ID, item.Title, item.FileName)
	}

	return nil
}

func runJudge(args []string) (int, error) {
	fs := flag.NewFlagSet("run", flag.ContinueOnError)
	subjectArg := fs.String("subject", "", "Subject id or path to subject.json")
	subjectsDir := fs.String("subjects-dir", detectSubjectsDir(), "Directory containing subjects")
	workspace := fs.String("workspace", ".", "Workspace used to resolve the expected Python file")
	submission := fs.String("submission", "", "Explicit path to the Python file to evaluate")
	pythonBin := fs.String("python", defaultPython, "Python interpreter to use")
	jsonOutput := fs.Bool("json", false, "Emit JSON report")
	detailedOutput := fs.Bool("detailed", false, "Emit the full jury sheet in terminal output")
	if err := fs.Parse(args); err != nil {
		return exitUsage, err
	}

	if strings.TrimSpace(*subjectArg) == "" {
		if isInteractiveTerminal() {
			return runInteractive(*subjectsDir, *workspace, *pythonBin)
		}
		return exitUsage, fmt.Errorf("--subject is required")
	}

	subjectPath, err := subject.ResolvePath(*subjectsDir, *subjectArg)
	if err != nil {
		return exitUsage, err
	}

	spec, err := subject.Load(subjectPath)
	if err != nil {
		return exitInternal, err
	}

	submissionPath := strings.TrimSpace(*submission)
	if submissionPath == "" {
		submissionPath = filepath.Join(*workspace, spec.FileName)
	}

	report, err := engine.Run(spec, engine.Options{
		PythonBin:      *pythonBin,
		SubmissionPath: submissionPath,
	})
	if err != nil {
		return exitInternal, err
	}

	suggestion := scoring.Build(report)

	if *jsonOutput {
		payload, err := json.MarshalIndent(struct {
			Report     engine.Report      `json:"report"`
			Suggestion scoring.Suggestion `json:"suggestion"`
		}{
			Report:     report,
			Suggestion: suggestion,
		}, "", "  ")
		if err != nil {
			return exitInternal, err
		}
		fmt.Println(string(payload))
	} else {
		printReport(report, suggestion, *detailedOutput)
	}

	return exitCodeForStatus(report.Status), nil
}

func printReport(report engine.Report, suggestion scoring.Suggestion, detailed bool) {
	statusColor := ansiYellow
	statusLabel := strings.ToUpper(report.Status)
	switch report.Status {
	case "passed":
		statusColor = ansiGreen
	case "failed", "runtime_error", "timeout", "load_error":
		statusColor = ansiRed
	}

	fmt.Printf("%sCode Relay Judge%s\n", style(ansiBlue, true), style("", false))
	fmt.Println("--------------------------------------------------")
	fmt.Printf("Subject   : %s (%s)\n", report.SubjectTitle, report.SubjectID)
	fmt.Printf("File      : %s\n", report.SubmissionPath)
	fmt.Printf("Status    : %s%s%s\n", style(statusColor, true), statusLabel, style("", false))
	fmt.Printf("Time      : %.2fms\n", report.DurationMs)

	if report.Message != "" {
		fmt.Printf("Message   : %s\n", report.Message)
	}

	if len(report.Groups) > 0 {
		fmt.Printf("Tests     : %s\n", compactGroups(report.Groups))
	}

	if len(report.Failures) > 0 {
		fmt.Printf("Issues    : %s\n", compactFailures(report.Failures))
	}

	fmt.Printf("Auto      : correction %d/40 | edge %d/20 | complexity %d/20\n",
		suggestion.Correction,
		suggestion.EdgeCases,
		suggestion.Complexity,
	)
	fmt.Printf("Manual    : readability __/10 | speed __/10\n")
	fmt.Printf("Subtotal  : %d/80 auto | final ____/100\n", suggestion.PartialTotal)

	if len(suggestion.DecisionSupport) > 0 {
		fmt.Printf("Profile   : %s\n", suggestion.DecisionSupport[0])
	}

	if !detailed {
		fmt.Printf("Details   : use --detailed or --json\n")
	}

	if detailed {
		fmt.Println()
		if len(suggestion.Notes) > 0 {
			fmt.Println("Scoring notes:")
			for _, note := range suggestion.Notes {
				fmt.Printf("  - %s\n", note)
			}
			fmt.Println()
		}
		printJurySheet(report, suggestion)
	}
}

func compactGroups(groups []engine.GroupReport) string {
	parts := make([]string, 0, len(groups))
	for _, group := range groups {
		parts = append(parts, fmt.Sprintf("%s %d/%d", shortGroupName(group.Name), group.Passed, group.Total))
	}
	return strings.Join(parts, " | ")
}

func compactFailures(failures []engine.Failure) string {
	maxItems := 3
	parts := make([]string, 0, min(len(failures), maxItems))
	for index, failure := range failures {
		if index >= maxItems {
			break
		}
		parts = append(parts, fmt.Sprintf("%s/%s: %s", shortGroupName(failure.Group), failure.Name, failure.Message))
	}

	if len(failures) > maxItems {
		parts = append(parts, fmt.Sprintf("+%d more", len(failures)-maxItems))
	}

	return strings.Join(parts, " | ")
}

func shortGroupName(name string) string {
	switch name {
	case "core":
		return "core"
	case "edge":
		return "edge"
	case "anti-hardcode":
		return "anti"
	case "perf":
		return "perf"
	default:
		return name
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func runInteractive(subjectsDir, workspace, pythonBin string) (int, error) {
	items, err := subject.Discover(subjectsDir)
	if err != nil {
		return exitInternal, err
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].ID < items[j].ID
	})

	if len(items) == 0 {
		return exitInternal, fmt.Errorf("no subjects found in %s", subjectsDir)
	}

	reader := bufio.NewReader(os.Stdin)
	fmt.Printf("%sAvailable subjects%s\n", style(ansiBlue, true), style("", false))
	for index, item := range items {
		fmt.Printf("  %d. %s (%s)\n", index+1, item.Title, item.FileName)
	}

	fmt.Print("Choose a subject number: ")
	choiceRaw, err := reader.ReadString('\n')
	if err != nil {
		return exitInternal, err
	}

	choice, err := strconv.Atoi(strings.TrimSpace(choiceRaw))
	if err != nil || choice < 1 || choice > len(items) {
		return exitUsage, fmt.Errorf("invalid subject selection")
	}

	selected := items[choice-1]

	defaultWorkspace := workspace
	if strings.TrimSpace(defaultWorkspace) == "" {
		defaultWorkspace = "."
	}

	fmt.Printf("Workspace [%s]: ", defaultWorkspace)
	workspaceRaw, err := reader.ReadString('\n')
	if err != nil {
		return exitInternal, err
	}

	workspaceValue := strings.TrimSpace(workspaceRaw)
	if workspaceValue == "" {
		workspaceValue = defaultWorkspace
	}

	subjectPath, err := subject.ResolvePath(subjectsDir, selected.ID)
	if err != nil {
		return exitInternal, err
	}

	spec, err := subject.Load(subjectPath)
	if err != nil {
		return exitInternal, err
	}

	report, err := engine.Run(spec, engine.Options{
		PythonBin:      pythonBin,
		SubmissionPath: filepath.Join(workspaceValue, spec.FileName),
	})
	if err != nil {
		return exitInternal, err
	}

	fmt.Println()
	printReport(report, scoring.Build(report), false)
	return exitCodeForStatus(report.Status), nil
}

func exitCodeForStatus(status string) int {
	switch status {
	case "passed":
		return exitPassed
	case "failed":
		return exitFailed
	case "runtime_error":
		return exitRuntime
	case "timeout":
		return exitTimeout
	case "load_error":
		return exitLoadError
	default:
		return exitInternal
	}
}

func detectSubjectsDir() string {
	execPath, err := os.Executable()
	if err == nil {
		candidate := filepath.Join(filepath.Dir(execPath), defaultSubjects)
		if isDir(candidate) {
			return candidate
		}
	}

	cwd, err := os.Getwd()
	if err == nil {
		candidates := []string{
			filepath.Join(cwd, defaultSubjects),
			filepath.Join(cwd, "relay-judge", defaultSubjects),
		}

		for _, candidate := range candidates {
			if isDir(candidate) {
				return candidate
			}
		}
	}

	return defaultSubjects
}

func isDir(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func isInteractiveTerminal() bool {
	info, err := os.Stdin.Stat()
	return err == nil && (info.Mode()&os.ModeCharDevice) != 0
}

func style(color string, bold bool) string {
	if !isInteractiveTerminal() {
		return ""
	}

	prefix := ""
	if bold {
		prefix += ansiBold
	}

	if color != "" {
		prefix += color
	}

	if prefix == "" {
		return ansiReset
	}

	return prefix
}

func printJurySheet(report engine.Report, suggestion scoring.Suggestion) {
	fmt.Printf("%sJURY SHEET%s\n", style(ansiBlue, true), style("", false))
	fmt.Printf("Subject: %s\n", report.SubjectTitle)
	fmt.Printf("File: %s\n", report.SubmissionPath)
	fmt.Println()

	fmt.Println("1. Correction de la solution")
	fmt.Printf("   Suggested: %d / 40\n", suggestion.Correction)
	fmt.Println("   Jury note: ____ / 40")
	fmt.Println("   Comments:")
	fmt.Println("   - ______________________________________________")

	fmt.Println("2. Gestion des edge cases")
	fmt.Printf("   Suggested: %d / 20\n", suggestion.EdgeCases)
	fmt.Println("   Jury note: ____ / 20")
	fmt.Println("   Comments:")
	fmt.Println("   - ______________________________________________")

	fmt.Println("3. Qualite algorithmique / complexite")
	fmt.Printf("   Suggested: %d / 20\n", suggestion.Complexity)
	fmt.Println("   Jury note: ____ / 20")
	fmt.Println("   Comments:")
	fmt.Println("   - ______________________________________________")

	fmt.Println("4. Lisibilite / proprete du code")
	fmt.Println("   Suggested: manuel")
	fmt.Println("   Jury note: ____ / 10")
	fmt.Println("   Comments:")
	fmt.Println("   - ______________________________________________")

	fmt.Println("5. Bonus rapidite")
	fmt.Println("   Suggested: manuel")
	fmt.Println("   Jury note: ____ / 10")
	fmt.Println("   Rang d'arrivee: __________________")

	fmt.Println("FINAL SUMMARY")
	fmt.Printf("   Suggested partial total: %d / 80\n", suggestion.PartialTotal)
	fmt.Println("   Final total: ____ / 100")
	fmt.Println()

	fmt.Println("GLOBAL APPRECIATION")
	fmt.Println("   Points forts:")
	fmt.Println("   - ______________________________________________")
	fmt.Println("   Points faibles:")
	fmt.Println("   - ______________________________________________")
	fmt.Println("   Avis general du jury:")
	fmt.Println("   - ______________________________________________")
}
