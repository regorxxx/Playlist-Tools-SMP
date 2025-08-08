'use strict';
//07/08/25

/* exported _Macros */

include('helpers_xxx.js');
/* global popup:readable, WshShell:readable */
include('helpers_xxx_prototypes.js');
/* global repeatFn:readable */

function _Macros(
	menu, // Linked to some menu object by Menu-Framework-SMP
	options = { /*
		listenerRate: 100,
		runRate: 10,
		maxRecursion: 10
*/}) {
	const stack = [];
	const queue = { stack: [], processed: [], stackCalls: 0 };
	let currListener = null;
	this.options = { listenerRate: 100, runRate: 50, maxRecursion: 10, ...(options || {}) };
	this.get = () => [...stack];
	this.set = (newStack) => {
		stack.length = 0;
		newStack.forEach((m) => stack.push(m));
	};
	this.count = () => stack.length;
	this.isRecording = () => currListener !== null;
	this.isRunning = () => queue.stack.length > 0;
	this.getRunning = (idx = 0) => (this.isRunning() ? queue.stack.slice(idx)[0] : null);
	this.record = () => {
		let name;
		let entry = [];
		let bAsync = false;
		while (!name || stack.findIndex((macro) => { return macro.name === name; }) !== -1) {
			try { name = utils.InputBox(window.ID, 'Enter name', window.Name + ': Macros', 'My macro', true); }
			catch (e) { return; } // eslint-disable-line no-unused-vars
			if (!name.length) { return; }
			if (stack.findIndex((macro) => { return macro.name === name; }) !== -1) { fb.ShowPopupMessage('Already exists a macro with same name', window.Name + ': Macros'); }
		}
		bAsync = WshShell.Popup('Execute entries asynchronously?\ni.e. Don\'t wait for entry\'s completion to call the next one.\nOnly for those entries that support it.\nCheck \'Configuration\\Asynchronous processing\' for more info.', 0, window.Name + ': Macros', popup.question + popup.yes_no) === popup.yes;
		stack.push({ name, entry, bAsync });
		menu.lastCall = '';
		currListener = this.listener(name);
		return stack[stack.length - 1];
	};
	this.save = () => {
		clearInterval(currListener);
		currListener = null;
		const macro = stack[stack.length - 1];
		return (macro.entry.length ? macro : stack.pop() && null);
	};
	this.listener = repeatFn((name) => {
		const recMacro = stack[stack.length - 1];
		if (!recMacro || recMacro.name !== name) { clearInterval(currListener); return; } // Safety check
		if (this.isRunning()) { return; }
		else if (menu.lastCall.length) {
			recMacro.entry.push(menu.lastCall);
			menu.lastCall = '';
		}
	}, this.options.listenerRate);
	this.run = (macro, bDebug = false) => {
		queue.stackCalls++;
		queue.stack.push(macro);
		if (queue.stackCalls >= this.options.maxRecursion) {
			queue.stackCalls = 0;
			queue.stack.length = 0;
			fb.ShowPopupMessage('Too much recursion (max ' + this.options.maxRecursion + ' calls):\n\n' + queue.processed.map(m => m.name).join(' -> '), window.Name + ': Macros');
			queue.processed.length = 0;
			return Promise.resolve(null);
		}
		// Don't save macros' sub-entries within macros (but the parent macro entry is allowed)
		const wasRunning = this.isRunning();
		if (this.isRecording() && !wasRunning && menu.lastCall) {
			const recMacro = stack[stack.length - 1];
			if (recMacro) { recMacro.entry.push(menu.lastCall); }
		}
		return Promise.serial(macro.entry, (entry) => { // Without this, panel crashes due to menu resources not being freed fast enough
			if (bDebug) { console.log(entry); }
			return menu.btn_up(void (0), void (0), void (0), entry, void (0), void (0), void (0), { pos: 1, args: macro.bAsync });
		}, this.options.runRate).then((results) => {
			if (!wasRunning) { queue.stackCalls = 0; queue.processed.length = 0; }
			queue.processed.push(queue.stack.pop());
			menu.lastCall = '';
			return results;
		});
	};
	this.runByName = (name, bDebug) => {
		const macro = stack.find((macro) => { return macro.name === name; });
		return macro ? this.run(macro, bDebug) : Promise.resolve(null);
	};
}