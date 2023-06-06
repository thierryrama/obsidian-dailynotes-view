import {Editor, MarkdownView, Plugin, TFile} from "obsidian";
import {EditorView} from "@codemirror/view";
import {deleteCharBackward} from "@codemirror/commands";
import {DailyNotesViewSettings, DailyNotesViewSettingTab, DisplayOrder, LengthUnit} from "./DailyNotesViewSettingTab";
import {getAllDailyNotes, getDateFromFile} from "obsidian-daily-notes-interface";
import moment from "moment";

/**
 * Default values for setting.
 */
const DEFAULT_SETTINGS: DailyNotesViewSettings = {
	outlineNoteName: "DailyNotesOutline.md",
	length: 1,
	lengthUnit: LengthUnit.Week,
	enableBackspaceCommand: false,
	displayOrder: DisplayOrder.RecentFirst
};

export default class DailyNotesViewPlugin extends Plugin {
	settings: DailyNotesViewSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"calendar-heart",
			"Open Daily Notes Outline",
			async () => {
				await this.openNotesOutline();
			});

		// Command to type backspace. Useful on iPad and Pencil.
		if (this.settings.enableBackspaceCommand) {
			this.addCommand({
				id: "dailynotesview-backspace-editor-command",
				name: "Type backspace",
				mobileOnly: true,
				editorCallback: (editor: Editor, view: MarkdownView) => {
					if (view) {
						// @ts-expect-error
						const editorView = view.editor.cm as EditorView;
						deleteCharBackward(editorView);
					}
				}
			});
		}

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new DailyNotesViewSettingTab(this.app, this));

		this.registerFileEventListener();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 *
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Generate the outline file from the given list of notes.

	 * @return {Promise<void>}
	 */
	async generateNotesOutline() {
		let outlinePath = this.settings.outlineNoteName;
		let notes = this.getDailyNotesInRange(
			this.settings.length,
			this.settings.lengthUnit,
			this.settings.displayOrder);
		let content = this.generateOutlineContent(notes);

		let outlineFile = this.app.vault.getAbstractFileByPath(outlinePath) as TFile;
		if (outlineFile === null) {
			await this.app.vault.create(outlinePath, content);
		} else {
			await this.app.vault.modify(outlineFile as TFile, content);
		}
	}

	/**
	 * Generate the content of the notes outline from the list of notes.
	 * @param notes list of notes.
	 * @returns {string}
	 */
	protected generateOutlineContent(notes: { date: moment.Moment; file: TFile }[]): string {
		let content = `Found ${notes.length} notes.\n\n`;
		let year = 0;
		let month = 0;
		for (let note of notes) {
			if (year != note.date.year()) {
				year = note.date.year();
				month = note.date.month();
				content += `# ${year}\n## ${note.date.format('MMMM')}\n`;
			} else if (month !== note.date.month()) {
				month = note.date.month();
				content += `## ${note.date.format('MMMM')}\n`;
			}
			content += `### ${note.file.basename}\n![[${note.file.basename}]]\n\n`;
		}

		return content;
	}

	/**
	 * Get all daily notes that are within the moving window specified in the app settings.
	 *
	 * @param length the size of the moving window.
	 * @param unit the unit in which the size of the moving window is expressed.
	 * @param order the order in which the notes will be displayed.
	 */
	protected getDailyNotesInRange(length: number, unit: LengthUnit, order: DisplayOrder): {
		date: moment.Moment;
		file: TFile
	}[] {
		let durationUnit: moment.unitOfTime.DurationConstructor;

		switch (unit) {
			case LengthUnit.Day:
				durationUnit = "days";
				break;
			case LengthUnit.Week:
				durationUnit = "weeks"
				break;
			case LengthUnit.Month:
				durationUnit = "months";
				break;
			case LengthUnit.Year:
				durationUnit = "years";
				break;
			default:
				durationUnit = "days";
				break;
		}

		// date range
		let upperBound = moment();
		let lowerBound = upperBound.clone().subtract(length, durationUnit);
		let allDailyNotes = Object.values(getAllDailyNotes());
		let dailyNotesInRange = allDailyNotes
			.map(tFile => ({date: getDateFromFile(tFile, "day") ?? upperBound, file:tFile}))
			.filter(value => value.date.isBetween(lowerBound, upperBound, "day", "[]"))

		// enums are the worst part of typescript. Not natural and subject to confusion. Stay away from
		// especially when using string enum. The crazy use of keys and values is due to getting the enum value so
		// that it matches what is used by the case statement. The dumbest language construct ever.
		switch (Object.values(DisplayOrder)[Object.keys(DisplayOrder).indexOf(order)]) {
			case DisplayOrder.OlderFirst:
				dailyNotesInRange.sort((a, b) =>
					a.date.isSameOrAfter(b.date) ? 1 : -1);
				break;
			case DisplayOrder.RecentFirst:
				dailyNotesInRange.sort((a, b) =>
					a.date.isSameOrBefore(b.date) ? 1 : -1);
				break;
		}

		return dailyNotesInRange;
	}

	/**
	 * Register listener for re-generating of the outline. We need to listen when a file is created, deleted and renamed.
	 */
	registerFileEventListener() {
		let regenerateOutlineFunc = async (file: TFile) => {
			if (this.app.workspace.layoutReady && file.name !== this.settings.outlineNoteName) {
				await this.generateNotesOutline();
			}
		}

		this.registerEvent(this.app.vault.on("create", regenerateOutlineFunc));
		this.registerEvent(this.app.vault.on("delete", regenerateOutlineFunc));
		this.registerEvent(this.app.vault.on("rename", regenerateOutlineFunc));
	}

	/**
	 * Opens the outlines note.
	 */
	async openNotesOutline() {
		let leaf = this.app.workspace.getLeaf('tab');
		await this.generateNotesOutline();

		let viewer = this.app.vault.getAbstractFileByPath(this.settings.outlineNoteName) as TFile;
		await leaf.openFile(viewer);
	}
}

