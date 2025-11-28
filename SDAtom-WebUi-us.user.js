//==UserScript==
//@name         SDAtom-WebUi-us
//@namespace    SDAtom-WebUi-us
//@version      1.4.4
//@description  Queue for AUTOMATIC1111 WebUi and an option to saving settings
//@author       Kryptortio
//@homepage     https://github.com/Kryptortio/SDAtom-WebUi-us
//@match        http://127.0.0.1:7860/*
//@updateURL    https://raw.githubusercontent.com/Kryptortio/SDAtom-WebUi-us/main/SDAtom-WebUi-us.user.js
//@downloadURL  https://raw.githubusercontent.com/Kryptortio/SDAtom-WebUi-us/main/SDAtom-WebUi-us.user.js
//@grant        none
//==/UserScript==

'use strict';
(() => {

const c_scriptVersion = typeof GM_info == 'undefined' ? '1.3.2' : GM_info.script.version,
c_scriptHandeler = typeof GM_info == 'undefined' ? '(not user script)' : GM_info.scriptHandler;

//From https://github.com/Pecacheu/Utils.js
//Create element of type with parent, className, style object, and innerHTML string
//(Just remember the order PCSI!) Use null to leave any parameter blank
const utils = {};
utils.mkEl = (t,p,c,s,i) => {
	const e=document.createElement(t);
	if(c!=null) e.className=c; if(i!=null) e.innerHTML=i;
	if(s && typeof s=='object') for(let k in s) {
		if(k in e.style) e.style[k]=s[k]; else e.style.setProperty(k,s[k]);
	}
	if(p!=null) p.appendChild(e); return e;
}
utils.mkDiv = (p,c,s,i) => utils.mkEl('div',p,c,s,i);

//----------------------------------------------------------------------------- Config
let conf = {
	shadowDOM: {sel: "gradio-app"},
	commonData: {
		t2iContainer: {sel: "#tab_txt2img"},
		i2iContainer: {sel: "#tab_img2img"},
		extContainer: {sel: "#tab_extras"},
		sdModelCheckpoint: {grad: "setting_sd_model_checkpoint"},
		versionContainer: {sel: "#footer .versions"},
		working: false,
		processing: false,
		waiting: false,
	},
	t2i: {
		controls: {
			tabButton: {sel: "#tabs > div:nth-child(1) > button:nth-child(1)"},
			genrateButton: {sel: "#txt2img_generate"},
			skipButton: {sel: "#txt2img_skip"},
		},
		prompt: {sel: "#txt2img_prompt textarea"},
		negPrompt: {sel: "#txt2img_neg_prompt textarea"},
		sample: {sel: "#txt2img_steps [id^=range_id]", sel2: "#txt2img_steps input"},
		sampleMethod: {grad: "txt2img_sampling"},
		width: {sel: "#txt2img_width [id^=range_id]", sel2: "#txt2img_width input"},
		height: {sel: "#txt2img_height [id^=range_id]", sel2: "#txt2img_height input"},
		/*restoreFace: {sel:"#txt2img_settings #setting_face_restoration input"},
		tiling: {sel:"#txt2img_settings #setting_tiling input"},*/
		highresFix: {sel: "#txt2img_hr"},
		hrFixUpscaler: {grad: "txt2img_hr_upscaler"},
		hrFixSteps: {sel: "#txt2img_hires_steps [id^=range_id]", sel2: "#txt2img_hires_steps input"},
		hrFixdenoise: {sel: "#txt2img_denoising_strength [id^=range_id]", sel2: "#txt2img_denoising_strength input"},
		hrFixUpscaleBy: {sel: "#txt2img_hr_scale [id^=range_id]", sel2: "#txt2img_hr_scale input"},
		hrFixWidth: {sel: "#txt2img_hr_resize_x [id^=range_id]", sel2: "#txt2img_hr_resize_x input"},
		hrFixHeight: {sel: "#txt2img_hr_resize_y [id^=range_id]", sel2: "#txt2img_hr_resize_y input"},
		batchCount: {sel: "#txt2img_batch_count [id^=range_id]", sel2: "#txt2img_batch_count input"},
		batchSize: {sel: "#txt2img_batch_size [id^=range_id]", sel2: "#txt2img_batch_size input"},
		cfg: {sel: "#txt2img_cfg_scale [id^=range_id]", se2: "#txt2img_cfg_scale input"},
		seed: {sel: "#txt2img_seed input"},
		extra: {sel: "#txt2img_subseed_show input"},
		varSeed: {sel: "#txt2img_subseed input"},
		varStr: {sel: "#txt2img_subseed_strength [id^=range_id]", sel2: "#txt2img_subseed_strength input"},
		varRSFWidth: {sel: "#txt2img_seed_resize_from_w [id^=range_id]", sel2: "#txt2img_seed_resize_from_w input"},
		varRSFHeight: {sel: "#txt2img_seed_resize_from_h [id^=range_id]", sel2: "#txt2img_seed_resize_from_h input"},

		script: {grad: "script_list", gradIndex: 0},

		scriptPromptMatrixPutVar: {sel: "#script_txt2img_prompt_matrix_put_at_start input"},
		scriptPromptMatrixUseDiff: {sel: "#script_txt2img_prompt_matrix_different_seeds input"},

		scriptXYZXtype: {grad: "script_txt2img_xyz_plot_x_type"},
		scriptXYZXVals: {sel: "#script_txt2img_xyz_plot_x_values textarea"},
		scriptXYZYtype: {grad: "script_txt2img_xyz_plot_y_type"},
		scriptXYZYVals: {sel: "#script_txt2img_xyz_plot_y_values textarea"},
		scriptXYZZtype: {grad: "script_txt2img_xyz_plot_z_type"},
		scriptXYZZVals: {sel: "#script_txt2img_xyz_plot_z_values textarea"},
		scriptXYZDrawLeg: {sel: "#script_txt2img_xyz_plot_draw_legend input"},
		scriptXYZIncludeSubImg: {sel: "#script_txt2img_xyz_plot_include_lone_images input"},
		scriptXYZIncludeSubGrid: {sel: "#script_txt2img_xyz_plot_include_sub_grids input"},
		scriptXYZKeepMOne: {sel: "#script_txt2img_xyz_plot_no_fixed_seeds input"},
		scriptXYZGridMargin: {sel: "#script_txt2img_xyz_plot_margin_size [id^=range_id]", sel2: "#script_txt2img_xyz_plot_margin_size input"},
	},
	i2i: {
		controls: {
			tabButton: {sel: "#tabs > div:nth-child(1) > button:nth-child(2)"},
			genrateButton: {sel: "#img2img_generate"},
			skipButton: {sel: "#img2img_skip"},
			i2iMode: [
				{name: "i2i", buttonSel: "#mode_img2img button:nth-child(1)", containerSel: "#img2img_img2img_tab"},
				{name: "sketch", buttonSel: "#mode_img2img button:nth-child(2)", containerSel: "#img2img_img2img_sketch_tab"},
				{name: "inpaint", buttonSel: "#mode_img2img button:nth-child(3)", containerSel: "#img2img_inpaint_tab"},
				{name: "inpaintSketch", buttonSel: "#mode_img2img button:nth-child(4)", containerSel: "#img2img_inpaint_sketch_tab"},
				{name: "inpaintUpload", buttonSel: "#mode_img2img button:nth-child(5)", containerSel: "#img2img_inpaint_upload_tab"},
				{name: "batch", buttonSel: "#mode_img2img button:nth-child(6)", containerSel: "#img2img_batch_tab"},
			],
		},
		prompt: {sel: "#img2img_prompt textarea"},
		negPrompt: {sel: "#img2img_neg_prompt textarea"},
		resizeMode: {sel: "#resize_mode"},
		inpaintBlur: {sel: "#img2img_mask_blur [id^=range_id]", sel2: "#img2img_mask_blur"},
		inpaintMaskMode: {sel: "#img2img_mask_mode"},
		inpaintMaskContent: {sel: "#img2img_inpainting_fill"},
		inpaintArea: {sel: "#img2img_inpaint_full_res"},
		inpaintPadding: {sel: "#img2img_inpaint_full_res_padding [id^=range_id]", sel2: "#img2img_inpaint_full_res_padding"},
		i2iBatchInputDir: {sel: "#img2img_batch_input_dir textarea"},
		i2iBatchOutputDir: {sel: "#img2img_batch_output_dir textarea"},
		i2iBatchMaskDir: {sel: "#img2img_batch_inpaint_mask_dir textarea"},
		sample: {sel: "#img2img_steps [id^=range_id]", sel2: "#img2img_steps input"},
		sampleMethod: {grad: "img2img_sampling"},
		width: {sel: "#img2img_width [id^=range_id]", sel2: "#img2img_width input"},
		height: {sel: "#img2img_height [id^=range_id]", sel2: "#img2img_height input"},
		/*restoreFace: {sel:"#img2img_settings #setting_face_restoration input"},
		tiling: {sel:"#img2img_settings #setting_tiling input"},*/
		batchCount: {sel: "#img2img_batch_count [id^=range_id]", sel2: "#img2img_batch_count input"},
		batchSize: {sel: "#img2img_batch_size [id^=range_id]", sel2: "#img2img_batch_size input"},
		cfg: {sel: "#img2img_cfg_scale [id^=range_id]", se2: "#img2img_cfg_scale input"},
		denoise: {sel: "#img2img_denoising_strength [id^=range_id]", se2: "#img2img_denoising_strength input"},
		seed: {sel: "#img2img_seed input"},
		extra: {sel: "#txt2img_subseed_show input"},
		varSeed: {sel: "#img2img_subseed input"},
		varStr: {sel: "#img2img_subseed_strength input", sel2: "#img2img_subseed_strength [id^=range_id]"},
		varRSFWidth: {sel: "#img2img_seed_resize_from_w input", sel2: "#img2img_seed_resize_from_w [id^=range_id]"},
		varRSFHeight: {sel: "#img2img_seed_resize_from_h input", sel2: "#img2img_seed_resize_from_h [id^=range_id]"},

		script: {grad: "script_list", gradIndex: 1},

		scriptPromptMatrixPutVar: {sel: "#script_img2img_prompt_matrix_put_at_start input"},
		scriptPromptMatrixUseDiff: {sel: "#script_img2img_prompt_matrix_different_seeds input"},

		scriptXYZXtype: {grad: "script_img2img_xyz_plot_x_type"},
		scriptXYZXVals: {sel: "#script_img2img_xyz_plot_x_values textarea"},
		scriptXYZYtype: {grad: "script_img2img_xyz_plot_y_type"},
		scriptXYZYVals: {sel: "#script_img2img_xyz_plot_y_values textarea"},
		scriptXYZZtype: {grad: "script_img2img_xyz_plot_z_type"},
		scriptXYZZVals: {sel: "#script_img2img_xyz_plot_z_values textarea"},
		scriptXYZDrawLeg: {sel: "#script_img2img_xyz_plot_draw_legend input"},
		scriptXYZIncludeSubImg: {sel: "#script_img2img_xyz_plot_include_lone_images input"},
		scriptXYZIncludeSubGrid: {sel: "#script_img2img_xyz_plot_include_sub_grids input"},
		scriptXYZKeepMOne: {sel: "#script_img2img_xyz_plot_no_fixed_seeds input"},
		scriptXYZGridMargin: {sel: "#script_img2img_xyz_plot_margin_size [id^=range_id]", sel2: "#script_img2img_xyz_plot_margin_size input"},

		scripti2iAltTestOverrideSampM: {sel: "#script_img2img_alternative_test_override_sampler input"},
		scripti2iAltTestOverrideProm: {sel: "#script_img2img_alternative_test_override_prompt input"},
		scripti2iAltTestOrigProm: {sel: "#script_img2img_alternative_test_original_prompt textarea"},
		scripti2iAltTestOrigNProm: {sel: "#script_img2img_alternative_test_original_negative_prompt textarea"},
		scripti2iAltTestOverrideSampS: {sel: "#script_img2img_alternative_test_override_steps input"},
		scripti2iAltTestDecStep: {sel: "#script_img2img_alternative_test_st input", sel2: "#script_img2img_alternative_test_st [id^=range_id]"},
		scripti2iAltTestOverrideDenoi: {sel: "#script_img2img_alternative_test_override_strength input"},
		scripti2iAltTestDecCFG: {sel: "#script_img2img_alternative_test_cfg input", sel2: "#script_img2img_alternative_test_cfg [id^=range_id]"},
		scripti2iAltTestRand: {sel: "#script_img2img_alternative_test_randomness input", sel2: "#script_img2img_alternative_test_randomness [id^=range_id]"},
		scripti2iAltTestSigma: {sel: "#script_img2img_alternative_test_sigma_adjustment input"},

		scriptLoopbackLoops: {sel: "#script_loopback_loops input", sel2: "#script_loopback_loops [id^=range_id]"},
		scriptLoopbackDenoStr: {sel: "#script_loopback_final_denoising_strength input", sel2: "#script_loopback_final_denoising_strength [id^=range_id]"},
		scriptLoopbackDenoStrCurve: {gradLab: "Denoising strength curve"},
		scriptLoopbackAppend: {gradLab: "Append interrogated prompt at each iteration"},

		scriptOutPMK2Pixels: {sel: "#script_outpainting_mk2_pixels input", sel2: "#script_outpainting_mk2_pixels [id^=range_id]"},
		scriptOutPMK2MaskBlur: {sel: "#script_outpainting_mk2_mask_blur input", sel2: "#script_outpainting_mk2_mask_blur [id^=range_id]"},
		scriptOutPMK2Left: {sel: "#script_outpainting_mk2_direction label:nth-child(1) input"},
		scriptOutPMK2Right: {sel: "#script_outpainting_mk2_direction label:nth-child(2) input"},
		scriptOutPMK2Up: {sel: "#script_outpainting_mk2_direction label:nth-child(3) input"},
		scriptOutPMK2Down: {sel: "#script_outpainting_mk2_direction label:nth-child(4) input"},
		scriptOutPMK2FallOff: {sel: "#script_outpainting_mk2_noise_q input", sel2: "#script_outpainting_mk2_noise_q [id^=range_id]"},
		scriptOutPMK2ColorVar: {sel: "#script_outpainting_mk2_color_variation input", sel2: "#script_outpainting_mk2_color_variation [id^=range_id]"},

		scriptPoorManPixels: {sel: "#script_poor_mans_outpainting_pixels input", sel2: "#script_poor_mans_outpainting_pixels [id^=range_id]"},
		scriptPoorManMaskBlur: {sel: "#script_poor_mans_outpainting_mask_blur input", sel2: "#script_poor_mans_outpainting_mask_blur [id^=range_id]"},
		scriptPoorManMaskCont: {sel: "#script_poor_mans_outpainting_inpainting_fill"},
		scriptPoorManLeft: {sel: "#script_poor_mans_outpainting_direction label:nth-child(1) input"},
		scriptPoorManRight: {sel: "#script_poor_mans_outpainting_direction label:nth-child(2) input"},
		scriptPoorManUp: {sel: "#script_poor_mans_outpainting_direction label:nth-child(3) input"},
		scriptPoorManDown: {sel: "#script_poor_mans_outpainting_direction label:nth-child(4) input"},

		scriptSDUpTile: {sel: "#script_sd_upscale_overlap input", sel2: "#script_sd_upscale_overlap [id^=range_id]"},
		scriptSDUpScale: {sel: "#script_sd_upscale_scale_factor input", sel2: "#script_sd_upscale_scale_factor [id^=range_id]"},
		scriptSDUpUpcaler: {sel: "#script_sd_upscale_upscaler_index"},
	},
	ext: {
		controls: {
			tabButton: {sel: "#tabs > div:nth-child(1) > button:nth-child(3)"},
			genrateButton: {sel: "#extras_generate"},
			loadingElement: {sel: "#html_info_x_extras .wrap"},
			extrasResizeMode: [
				{name: "scaleBy", buttonSel: "#extras_resize_mode button:nth-child(1)", containerSel: "#extras_scale_by_tab"},
				{name: "scaleTo", buttonSel: "#extras_resize_mode button:nth-child(2)", containerSel: "#extras_scale_to_tab"},
			],
			extrasMode: [
				{name: "singleImg", buttonSel: "#mode_extras button:nth-child(1)", containerSel: "#extras_single_tab"},
				{name: "batchProcess", buttonSel: "#mode_extras button:nth-child(2)", containerSel: "#extras_batch_process_tab"},
				{name: "batchDir", buttonSel: "#mode_extras button:nth-child(3)", containerSel: "#extras_batch_directory_tab"},
			],
		},
		scaleByResize: {sel: "#extras_upscaling_resize input", sel2: "#extras_upscaling_resize [id^=range_id]"},
		scaleToWidth: {sel: "#extras_upscaling_resize_w input"},
		scaleToHeight: {sel: "#extras_upscaling_resize_h input"},
		scaleToCropToFit: {sel: "#extras_upscaling_crop input"},
		batchDirInput: {sel: "#extras_batch_input_dir textarea"},
		batchDirOutput: {sel: "#extras_batch_output_dir textarea"},
		batchDirShowImg: {sel: "#extras_show_extras_results input"},
		upscaler1: {grad: "extras_upscaler_1"},
		upscaler2: {grad: "extras_upscaler_2"},
		upscale2Vis: {sel: "#extras_upscaler_2_visibility input", sel2: "#extras_upscaler_2_visibility [id^=range_id]"},
		GFPGANVis: {sel: "#extras_gfpgan_visibility input", sel2: "#extras_gfpgan_visibility [id^=range_id]"},
		CodeFormVis: {sel: "#extras_codeformer_visibility input", sel2: "#extras_codeformer_visibility [id^=range_id]"},
		CodeFormWeight: {sel: "#extras_codeformer_weight input", sel2: "#extras_codeformer_weight [id^=range_id]"},
	},
	extensions: {
		iBrowser: {
			name: "stable-diffusion-webui-images-browser",
			existCheck: {sel: "#tab_image_browser"},
			guiElems: {
				iBrowserContainer: {sel: "#tab_image_browser"},
				generationInfo: {sel: "#image_browser_tab_txt2img_image_browser_file_info textarea"},
				txt2img: {sel: '#image_browser_tab_txt2img_image_browser_file_info textarea'},
				img2img: {sel: '#image_browser_tab_img2img_image_browser_file_info textarea'},
				txt2imgG: {sel: '#image_browser_tab_txt2img-grids_image_browser_file_info textarea'},
				img2imgG: {sel: '#image_browser_tab_img2img-grids_image_browser_file_info textarea'},
				extras: {sel: '#image_browser_tab_extras_image_browser_file_info textarea'},
				favorites: {sel: '#image_browser_tab_favorites_image_browser_file_info textarea'},
			},
			ui: {},
			text: {
				queueVariationsButtonText: 'Add 5 variations',
				queueHiResVersionButtonText: 'Add HiRes version',
			},
			functions: {
				getValueJSON: () => {
					awqLog('iBrowser.getValueJSON: parsing data');
					let valueJSON = {type: 't2i'},
					currentTab = document.querySelector('#image_browser_tabs_container button.selected').innerHTML;
					currentTab = currentTab.replace(/\s/g, '');
					currentTab = currentTab.replace('-grids', 'G').toLowerCase(),
					generationInfoValue = conf.extensions.iBrowser.guiElems[currentTab].el.value;

					//Used when loading prompt from image browser
					/*
					Kind of using the logic from generation_parameters_copypaste.py/parse_generation_parameters (but not really, because that doesn't account for Template/Negative Template)
					Structure
					<prompt>
					Negative prompt: <negative prompt>
					a1: b1, a2: b2, etc
					Template: <template>
					Negative Template: <negative template>

					<prompt>, <negative prompt>, <template> and <negative template> can all be multiline, or missing.
					Maybe assume that <prompt> is never missing?
					*/
					let lines = generationInfoValue.split(/\r?\n/),
					whichLine = 0; //0=prompt, 1=negPrompt, 2=template, 3=negTemplate, 4: dictionary
					valueJSON['prompt'] = '', valueJSON['negPrompt'] = '';

					for(let l of lines) {
						if(l.startsWith("Negative prompt: ")) whichLine = 1, l = l.slice(17);
						else if(l.startsWith("Template: ")) whichLine = 2, l = l.slice(10);
						else if(l.startsWith("Negative Template: ")) whichLine = 3, l = l.slice(19);
						else if(l.startsWith("Steps: ")) whichLine = 4;

						switch(whichLine) {
						case 0:
							valueJSON['prompt'] += l;
							break;
						case 1:
							valueJSON['negPrompt'] += l;
							break;
						case 2:
							break; //ignore template
						case 3:
							break; //ignore neg template
						case 4:
							for(let v of l.split(/, /)) {
								let kv = v.split(/: /);
								switch(kv[0]) {
								case "Steps":
									valueJSON['sample'] = kv[1];
									break;
								case "Sampler":
									valueJSON['sampleMethod'] = kv[1];
									break;
								case "CFG scale":
									valueJSON['cfg'] = kv[1];
									break;
								case "Seed":
									valueJSON['seed'] = kv[1];
									break;
								case "Size":
									let wh = kv[1].split(/x/)
									valueJSON['width'] = wh[0];
									valueJSON['height'] = wh[1];
									break;
								case "Model":
									valueJSON['sdModelCheckpoint'] = kv[1];
									break;
								case "Denoising strength":
									valueJSON['hrFixdenoise'] = kv[1];
									break;
								case "Hires upscale":
									valueJSON['hrFixUpscaleBy'] = kv[1];
									valueJSON['highresFix'] = true;
									break;
								case "Hires upscaler":
									valueJSON['hrFixUpscaler'] = kv[1];
								}
							}
						}
					}
					return JSON.stringify(valueJSON);
				},
			},
		},
	},
	ui: {},
	scriptSettings: {
		defaultQty: {name: "Default queue quantity", description: "Default number of times to execute each queue item", type: "numeric", value: 1},
		rememberQueue: {name: "Remember queue", description: "Remember the queue if you reload the page", type: "boolean", value: true},
		stayReady: {name: "Stay ready", description: "Remain ready after end-of-queue until manually stopped", type: "boolean", value: false},
		notificationSound: {name: "Notification sound", description: "Sound to be played when processing of queue items stops", type: "boolean", value: true},
		extensionScript: {name: "Extension script(s)", description: "https://github.com/Kryptortio/SDAtom-WebUi-us#script-extensions", type: "text", value: ""},
		promptFilter: {name: "Prompt filter(s)", description: "https://github.com/Kryptortio/SDAtom-WebUi-us#prompt-filter", type: "text", value: ""},
		promptFilterNegative: {name: "Filter negative prompt", description: "Apply the prompt filter to the negative filter as well", type: "boolean", value: false},
		autoscrollOutput: {name: "Autoscroll console", description: "Scroll console automatically when new lines appear", type: "boolean", value: true},
		verboseLog: {name: "Verbose console", description: "Log as much as possible to the console", type: "boolean", value: false},
		maxOutputLines: {name: "Max console lines", description: "The maximum number of lines that can be shown in the console box", type: "numeric", value: 500},
		overwriteQueueSettings1: {name: "Alt 1 overwrite", description: "Add settings you want to overwrite the current settings with when you click the Alt 1 button to add to queue (same format as in the queue)", type: "text", value: '{"width":768, "height":768}'},
		overwriteQueueSettings2: {name: "Alt 2 overwrite", description: "Add settings you want to overwrite the current settings with when you click the Alt 2 button to add to queue (same format as in the queue)", type: "text", value: '{"width":1024, "height":1024}'},
		overwriteQueueSettings3: {name: "Alt 3 overwrite", description: "Add settings you want to overwrite the current settings with when you click the Alt 3 button to add to queue (same format as in the queue)", type: "text", value: '{"sample":20, "sampleMethod":"Euler a", "width":512, "height":512, "restoreFace":false, "tiling":false, "batchCount":1, "batchSize":1, "cfg":7, "seed":-1, "extra":false, "varSeed":-1, "varStr":0}'},
		buttonOpacity: {name: "Button transparency", description: "Change how visible the floating buttons in the corner should be", type: "numeric", value: 0.7},
	},
	savedSetting: JSON.parse(localStorage.awqSavedSetting || '{}'),
	currentQueue: JSON.parse(localStorage.awqCurrentQueue || '[]'),
}

if(localStorage.hasOwnProperty("awqNotificationSound") && !localStorage.hasOwnProperty("awqScriptSettings")) { //Tmp settings migration
	awqLog('Copying settings from old storage');
	if(localStorage.hasOwnProperty("awqNotificationSound"))
		conf.scriptSettings.notificationSound.value = localStorage.awqNotificationSound == 1;
	if(localStorage.hasOwnProperty("awqAutoscrollOutput"))
		conf.scriptSettings.autoscrollOutput.value = localStorage.awqAutoscrollOutput == 1;
	if(localStorage.hasOwnProperty("awqVerboseLog"))
		conf.scriptSettings.verboseLog.value = localStorage.awqVerboseLog == 1;
	if(localStorage.hasOwnProperty("awqMaxOutputLines"))
		conf.scriptSettings.maxOutputLines.value = localStorage.awqMaxOutputLines;
	if(localStorage.hasOwnProperty("awqPromptFilter"))
		conf.scriptSettings.promptFilter.value = localStorage.awqPromptFilter;
	if(localStorage.hasOwnProperty("awqExtensionScript"))
		conf.scriptSettings.extensionScript.value = localStorage.awqExtensionScript;
}

const c_emptyQueueString = 'Queue is empty',
c_addQueueText = 'Add to queue',
c_addQueueDesc = "Add an item to the queue according to current tab and settings",
c_addQueueDescAlt = c_addQueueDesc+" and overwrite with Alt ",
c_processButtonText = "Process Queue",
c_defaultTextStoredSettings = "Stored settings",
c_audio_base64 = new Audio('data:audio/mpeg;base64,//PkZAAAAAGkAAAAAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//PkZAAAAAGkAAAAAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVR9DU02wxI2HBY0xzzTPHVjsaEggIYbBQymbZ5et+lSLLDAPL2LcegkDNlkiLYgIBgMoIRxodnFVNMu2pmYwSfDSC2CxTFDKowcoycCimGKGFhYRCx50EjDS05dCEXJaIRTRHMTQfkO/U/sjuSEa5wroVM0a2hmXr0oA7JasD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V///+YGDIYDB4HGBRAYjCABAQMAOrVXeNb/////QYBwSBIETHQhBgBRAMGgq1lV3jW13f//////ogl+UTWeJbqBIMiQBa6X2STL/Y1tdq75lrtXf///////44AURAYAVhE+lMmFrcRNYQqJhyhq4FhWjY1tdx/mWu475lrv//////////rTVMnql4XBZApWX+aWuRL1jSmZf5pbEEvXQWDS+Z+yzHfK2u1d8y12rtFKTRUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//PkZAAAAAGkAOAAAAAAA0gBwAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');

const c_defaultOtputConsoleText = "Here you will see some information about what the script is doing",
c_defaultOtputConsoleTextHTML = `<span class="console-description" style="color:darkgray">${c_defaultOtputConsoleText}</span>`,
c_wait_tick_duration = 200,
c_any_value = '<ANY VALUE>';

//----------------------------------------------------------------------------- Logging
function preAwqLog(p_message) {console.log(`SDAtom-WebUi-us: ${p_message}`)}
preAwqLog(`Running SDAtom-WebUi-us version ${c_scriptVersion} using ${c_scriptHandeler} with browser ${navigator.userAgent}`);

function awqLog(p_message) {
	if(conf.scriptSettings.verboseLog.value) {
		awqLogPublishMsg(p_message, 'lightgray');
	}
}

function awqLogPublishMsg(p_message, p_color) {
	if(!conf.ui.msgConsole) return;
	if(conf.ui.msgConsole.innerHTML.match('console-description'))
		conf.ui.msgConsole.innerHTML = `* Running SDAtom-WebUi-us version ${c_scriptVersion} using ${c_scriptHandeler} with browser ${navigator.userAgent} stable-diffusion-webui version <span style="font-size: 0.9em;">${conf.commonData.versionContainer.el.textContent}</span>`;

	const timestamp = (new Date()).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});
	utils.mkDiv(conf.ui.msgConsole, null, null, `<span style="${p_color ? 'color:' + p_color : ''}">${timestamp}: ${p_message}</span>`);

	if(conf.ui.msgConsole.childElementCount >= conf.scriptSettings.maxOutputLines.value) conf.ui.msgConsole.firstChild.remove();
	if(conf.scriptSettings.autoscrollOutput.value) conf.ui.msgConsole.scrollTo(0, conf.ui.msgConsole.scrollHeight);
}

function awqLogPublishError(p_message) {awqLogPublishMsg(p_message, 'red')}
addEventListener("error", (event) => {
	if(conf.scriptSettings.verboseLog.value) awqLogPublishMsg(`Javascript error (can be caused by something other than this script): ${event.message} source:${event.filename} line:${event.lineno} col:${event.colno} Error:${event.error ? JSON.stringify(event.error) : ''}`, 'darkorange');
}, true);
addEventListener("unhandledrejection", (event) => {
	if(conf.scriptSettings.verboseLog.value) awqLogPublishMsg(`Javascript promise error (can be caused by something other than this script): ${event.reason}`, 'darkorange');
}, true);

let oldWarn = console.warn, oldInfo = console.info, oldLog = console.log, oldError = console.error;
console.warn = p_msg => {
	if(conf.scriptSettings.verboseLog.value) awqLogPublishMsg('log (warn) message (can be caused by something other than this script):' + p_msg + `<br>Call stack:<pre>${getCallStack()}</pre>`, 'lightgray'); oldWarn(p_msg);
}
console.info = p_msg => {
	if(conf.scriptSettings.verboseLog.value) awqLogPublishMsg('log (info) message (can be caused by something other than this script):' + p_msg + `<br>Call stack:<pre>${getCallStack()}</pre>`, 'lightgray'); oldInfo(p_msg);
}
console.log = p_msg => {
	if(conf.scriptSettings.verboseLog.value) awqLogPublishMsg('log (log) message (can be caused by something other than this script):' + p_msg + `<br>Call stack:<pre>${getCallStack()}</pre>`, 'lightgray'); oldLog(p_msg);
}

//----------------------------------------------------------------------------- Wait for content to load
let waitForLoadInterval = setInterval(initAWQ, c_wait_tick_duration);
function initAWQ() {
	conf.shadowDOM.root = document.querySelector(conf.shadowDOM.sel);
	if(!conf.shadowDOM.root || !conf.shadowDOM.root.querySelector('#txt2img_prompt')) return;
	clearInterval(waitForLoadInterval);

	conf.commonData.versionContainer.el = conf.shadowDOM.root.querySelector('#footer .versions');

	//Check for extensions
	for(let ext in conf.extensions) {
		if(!document.querySelector(conf.extensions[ext].existCheck.sel)) {
			preAwqLog(`Extension ${conf.extensions[ext].name} not found, disabling`);
			conf.extensions[ext] = false;
		} else {
			preAwqLog(`Extension ${conf.extensions[ext].name} found`);
		}
	}

	mapElementsToConf(conf.commonData, 'main object');
	mapElementsToConf(conf.t2i, 't2i object');
	mapElementsToConf(conf.t2i.controls, 't2i control');
	mapElementsToConf(conf.i2i, 'i2i object');
	mapElementsToConf(conf.i2i.controls, 'i2i control');
	mapElementsToConf(conf.ext, 'ext object');
	mapElementsToConf(conf.ext.controls, 'ext control');
	if(conf.extensions.iBrowser) waitForElm(conf.extensions.iBrowser.guiElems.txt2img.sel)
		.then(() => mapElementsToConf(conf.extensions.iBrowser.guiElems, 'iBrowser objects'));

	loadScriptSettings();
	generateMainUI();

	try {eval(conf.scriptSettings.extensionScript.value)} catch(e) {awqLogPublishMsg(`Failed to load extension script, error: <pre>${e.message} l:${e.lineNumber} c:${e.columnNumber}\n${e.stack}</pre>`, 'darkorange')}

	setInterval(updateStatus, c_wait_tick_duration);
}

function mapElementsToConf(p_object, p_info) {
	for(let prop in p_object) {
		if(p_object[prop].sel) {
			p_object[prop].el = conf.shadowDOM.root.querySelector(p_object[prop].sel);
			if(!p_object[prop].el) awqLogPublishError(`Failed to find the ${p_info} ${prop}`);
		}
		if(p_object[prop].sel2) {
			p_object[prop].el2 = conf.shadowDOM.root.querySelector(p_object[prop].sel2);
			if(!p_object[prop].el2) awqLogPublishError(`Failed to find the secondary ${p_info} ${prop}`);
		}
		if(p_object[prop].grad) {
			let gradIndex = p_object[prop].gradIndex ? p_object[prop].gradIndex : 0;
			p_object[prop].gradEl = findGradioComponentState(p_object[prop].grad)[gradIndex];
			if(!p_object[prop].gradEl) awqLogPublishError(`Failed to find the gradio element ${p_info} ${prop}`);
		}
		if(p_object[prop].gradLab) {
			p_object[prop].gradEl = findGradioComponentStateByLabel(p_object[prop].gradLab)[0];
			if(!p_object[prop].gradEl) awqLogPublishError(`Failed to find the gradio element ${p_info} ${prop}`);
		}
	}
}

function appendQueueBtn(parent, name, onclick, tip) {
	let btn = utils.mkEl('button', parent, null, null, name);
	btn.onclick = onclick, btn.title = tip;
	return btn;
}

function generateMainUI() {
	utils.mkEl('style', document.head, null, null, `
.AWQ-box input, .AWQ-box input[type=number], .AWQ-box select,
.AWQ-console > div, .awq-popup input, .awq-popup textarea {
	height:25px; vertical-align:top;
	box-shadow:var(--input-shadow);
	border:var(--input-border-width) solid var(--input-border-color);
	border-radius:var(--input-radius);
	background:var(--input-background-fill);
	color:var(--body-text-color);
	margin-right:5px; padding:2px 10px;
	font-size:100%; appearance:auto;
	scrollbar-width:thin;
}
.awq-popup :not(button) { color:var(--block-title-text-color); }
.awq-popup, .awq-popup * { box-sizing:border-box; }
.awq-popup {
	position:fixed; top:0; left:0; width:100%; height:100%;
	padding:30px 5%; z-index:9999; overflow-y:auto;
	font-family:sans-serif;
}
.awq-popup > div {
	width:100%; padding:20px;
	border-radius:15px; background:var(--background-fill-primary);
	box-shadow:3px 3px 100px black, 3px 3px 500px black, 3px 3px 25px black;
}
.awq-hdr {
	display:flex; justify-content:space-between;
	margin-bottom:10px;
}
.awq-settings {
	display:grid; grid-auto-flow:row; gap:15px;
	grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));
}
.awq-popup input:not([type=checkbox]), .awq-popup textarea { width:100%; margin:0; }
.awq-popup input[type=checkbox] { vertical-align:middle; margin:0 5px; }
.awq-popup button { margin:5px 0; }
.awq-popup button:last-child { margin-bottom:0; }
.awq-popup textarea { min-height:40px; resize:vertical; }

.AWQ-box button, .AWQ-overlay button, .awq-popup button {
	display:inline-block; height:25px; cursor:pointer;
	border:var(--button-border-width) solid var(--button-secondary-border-color);
	background:var(--button-secondary-background-fill);
	color:var(--button-secondary-text-color);
	border-radius:var(--input-radius);
	margin-right:5px; padding: 0 5px;
}
.AWQ-console > div { border-radius:unset; margin:0; padding:2px; }
.AWQ-box input.completed-queue-item {
	background:var(--button-secondary-background-fill);
	color:var(--button-secondary-text-color);
}
.AWQ-console {
	width:100%; height:160px;
	margin:5px 0; overflow:auto; color:gray;
	box-shadow:inset 0px 1px 4px #666;
}
.AWQ-queue { width:100%; margin-top:5px; color:gray; }
.AWQ-queue > div { display:flex; margin-bottom:5px; }
.AWQ-item-type { width:30px; text-align:center; }
.AWQ-item-type, .AWQ-item-JSON { padding:2px !important; }
.AWQ-item-qty { width:50px; }
.AWQ-item-JSON {
	flex-grow:1; margin:0 !important;
	text-overflow:ellipsis;
}

.AWQ-overlay {
	position:fixed; top:0; right:0;
	width:100px; z-index:99;
}
.AWQ-overlay div { display:flex; }
.AWQ-overlay button {
	width:100%; flex-grow:1;
	margin:0; color:#000;
	border-radius:0;
}`);

	let msgBox = utils.mkDiv(null, 'AWQ-box block gradio-accordion'),
	tabs = document.querySelector('#tabs');
	tabs.parentElement.insertBefore(msgBox, tabs.nextElementSibling);
	conf.ui.msgBox = msgBox;

	let overlay = utils.mkDiv(document.body, 'AWQ-overlay', {opacity:conf.scriptSettings.buttonOpacity.value});
	conf.ui.overlay = overlay;

	appendQueueBtn(overlay, c_addQueueText, appendQueueItem, c_addQueueDesc);
	let qbCont = utils.mkDiv(overlay);
	appendQueueBtn(qbCont, 'A1', () => {appendQueueItem(null, null, null, JSON.parse(conf.scriptSettings.overwriteQueueSettings1.value))}, c_addQueueDescAlt+1);
	appendQueueBtn(qbCont, 'A2', () => {appendQueueItem(null, null, null, JSON.parse(conf.scriptSettings.overwriteQueueSettings2.value))}, c_addQueueDescAlt+2);
	appendQueueBtn(qbCont, 'A3', () => {appendQueueItem(null, null, null, JSON.parse(conf.scriptSettings.overwriteQueueSettings3.value))}, c_addQueueDescAlt+3);

	let defQueueQty = utils.mkEl('input', msgBox, null, {width:'50px'});
	defQueueQty.type = 'number';
	defQueueQty.title = "How many items of each will be added to the queue (default is 1)";
	defQueueQty.value = conf.scriptSettings.defaultQty.value;
	defQueueQty.onchange = function() {conf.scriptSettings.defaultQty.value = this.value}
	defQueueQty.onfocus = function() {this.select()}
	conf.ui.defQueueQty = defQueueQty;

	let assignDefVal = utils.mkEl('button', msgBox, null, null, '⤵');
	assignDefVal.title = "Assign the default value to all queue items";
	assignDefVal.onclick = () => {
		if(conf.scriptSettings.defaultQty.value >= 0) {
			document.querySelectorAll('.AWQ-item-qty').forEach((inp) => {inp.value = conf.scriptSettings.defaultQty.value});
			updateQueueState();
		}
	}

	let processBtn = utils.mkEl('button', msgBox, null, null, c_processButtonText);
	processBtn.title = "Start processing the queue, click again to stop";
	processBtn.onclick = () => toggleProcessButton();
	conf.ui.processBtn = processBtn;

	let clearBtn = utils.mkEl('button', msgBox, null, null, "Clear Queue");
	clearBtn.title = "Empty the queue completely";
	clearBtn.onclick = () => {
		if(!confirm('Are you sure you want to remove everything in your queue?')) return;
		conf.ui.queueCont.innerHTML = c_emptyQueueString;
		let oldQueueLength = conf.currentQueue.length;
		conf.currentQueue = [];
		updateQueueState();
		awqLogPublishMsg(`Queue has been cleared, ${oldQueueLength} items removed`);
	}

	let settingsBtn = utils.mkEl('button', msgBox, null, {float:'right', margin:0}, "Settings");
	settingsBtn.title = "Open the script settings menu";
	settingsBtn.onclick = openSettings;

	conf.ui.queueCont = utils.mkDiv(msgBox, 'AWQ-queue', null, c_emptyQueueString);

	let clearSettingsBtn = utils.mkEl('button', msgBox, null, {background:'none'}, '❌');
	clearSettingsBtn.title = "Remove the currently selected setting";
	clearSettingsBtn.onclick = clearSetting;

	let setStore = utils.mkEl('select', msgBox);
	setStore.title = "List of stored settings (template of all settings)";
	conf.ui.settingsStorage = setStore;

	let editBtn = utils.mkEl('button', msgBox, null, null, '✏️');
	editBtn.title = "Edit the currently selected setting (a property can be removed to not change it when loading)";
	editBtn.onclick = editSetting;

	let loadSettingsBtn = utils.mkEl('button', msgBox, null, null, "Load");
	loadSettingsBtn.innerHTML = "Load";
	loadSettingsBtn.title = "Load the currently selected setting (replacing current settings)";
	loadSettingsBtn.onclick = loadSetting;

	let settingName = utils.mkEl('input', msgBox);
	settingName.placeholder = "Setting name";
	settingName.title = "Name to use when saving a new setting (duplicates not allowed)";
	settingName.onfocus = function() {this.select()}
	conf.ui.settingName = settingName;

	let saveBtn = utils.mkEl('button', msgBox, null, null, "Save");
	saveBtn.title = "Save currently selected settings so that you can load them again later";
	saveBtn.onclick = saveSettings;

	let msgConsole = utils.mkDiv(msgBox, 'AWQ-console', null, c_defaultOtputConsoleTextHTML)
	msgConsole.title = c_defaultOtputConsoleText;
	conf.ui.msgConsole = msgConsole;

	let msgClearBtn = utils.mkEl('button', msgBox, null, null, "Clear");
	msgClearBtn.title = "Clear the console above";
	msgClearBtn.onclick = () => {conf.ui.msgConsole.innerHTML = c_defaultOtputConsoleTextHTML}

	document.querySelector('.gradio-container').style.overflow = 'visible'; //Fix so that a dropdown menu can overlap the queue
	refreshSettings();

	if(conf.currentQueue.length > 0) {
		awqLog('Loaded saved queue:' + conf.currentQueue.length);
		for(let i = 0; i < conf.currentQueue.length; ++i)
			appendQueueItem(conf.currentQueue[i].qty, conf.currentQueue[i].value, conf.currentQueue[i].type);
		updateQueueState();
	}
	awqLog('generateMainUI: Completed');
}

function appendQueueItem(p_qty, p_value, p_type, p_overwrite_data) {
	awqLog(`appendQueueItem: qty:${p_qty} type:${p_type}`);

	if(conf.ui.queueCont.innerHTML == c_emptyQueueString) conf.ui.queueCont.innerHTML = '';
	let queueItm = utils.mkDiv(conf.ui.queueCont),
	qty = isNaN(p_qty) || p_qty == null ?
		(parseInt(conf.ui.defQueueQty.value) > 0 ?
		parseInt(conf.ui.defQueueQty.value) : 1) : p_qty;

	let delItm = utils.mkEl('button', queueItm, null, {background:'none'}, '❌');
	delItm.title = "Remove this item from the queue";
	delItm.onclick = () => {queueItm.remove(); updateQueueState()}

	let moveUp = utils.mkEl('button', queueItm, null, null, '⇧');
	moveUp.title = "Move this item up in the queue";
	moveUp.onclick = () => {
		let prevItm = queueItm.previousSibling;
		if(prevItm) {
			conf.ui.queueCont.insertBefore(queueItm, prevItm);
			updateQueueState();
		}
	}

	let moveDown = utils.mkEl('button', queueItm, null, null, '⇩');
	moveDown.title = "Move down in the queue";
	moveDown.onclick = () => {
		let nextItm = queueItm.nextSibling;
		if(nextItm) {
			conf.ui.queueCont.insertBefore(nextItm, queueItm);
			updateQueueState();
		}
	}

	let moveToBtm = utils.mkEl('button', queueItm, null, null, '⤓');
	moveToBtm.title = "Move to the bottom of the queue";
	moveToBtm.onclick = () => {
		let lastItm = conf.ui.queueCont.lastChild;
		if(lastItm.lastChild !== queueItm) {
			conf.ui.queueCont.appendChild(queueItm);
			updateQueueState();
		}
	}

	let moveToTop = utils.mkEl('button', queueItm, null, null, '⤒');
	moveToTop.title = "Move to the top of the queue";
	moveToTop.onclick = () => {
		let firstItm = conf.ui.queueCont.firstChild;
		if(firstItm && firstItm !== queueItm) {
			conf.ui.queueCont.insertBefore(queueItm, firstItm);
			updateQueueState();
		}
	}

	let loadItem = utils.mkEl('button', queueItm, null, null, "Load");
	loadItem.title = "Load the settings from this item";
	loadItem.onclick = () => loadJson(itemJSON.value);

	let itemType = utils.mkEl('input', queueItm, 'AWQ-item-type');
	itemType.title = "This is the type/tab for the queue item";
	itemType.disabled = true;

	let itemQty = utils.mkEl('input', queueItm, 'AWQ-item-qty');
	itemQty.type = 'number';
	itemQty.title = "This is how many times this item should be executed";
	itemQty.value = qty;
	function updateItemQtyBG() {
		if(itemQty.value.length == 0) itemQty.style.color = 'red';
		else if(itemQty.value < 1) itemQty.style.color = 'rgb(0, 225, 0)', itemQty.classList.add('completed-queue-item');
		else if(itemQty.value > 0) itemQty.style.color = 'white', itemQty.classList.remove('completed-queue-item');
	}
	itemQty.onchange = () => {updateItemQtyBG(); updateQueueState()}
	itemQty.onfocus = () => itemQty.select();
	updateItemQtyBG();

	let itemJSON = utils.mkEl('input', queueItm, 'AWQ-item-JSON');
	itemJSON.title = "This is a JSON string with all the settings to be used for this item. Can be changed while processing the queue but will fail if you enter invalid values.";
	itemJSON.value = p_value || getValueJSON(p_type);
	if(p_overwrite_data) {
		awqLog(`appendQueueItem: Adding to queue with Overwriting: ${JSON.stringify(p_overwrite_data)}`);
		let jsonData = JSON.parse(itemJSON.value);
		for(let setKey in p_overwrite_data) jsonData[setKey] = p_overwrite_data[setKey];
		itemJSON.value = JSON.stringify(jsonData);
	}
	(itemJSON.onchange = () => {
		updateQueueState();
		//Update itemType if needed
		let newType = itemJSON.value.match(/"type":"([^"]+)"/);
		itemType.value = newType ? newType[1] : null;
	})();

	awqLogPublishMsg(`Added new ${itemType.value} queue item (${qty}x)`);
	//Wait with updating state while loading a predefined queue
	if(isNaN(p_qty)) updateQueueState();
}

function saveScriptSettings() {
	awqLog('Saving script settings');
	let scriptSettingsCopy = structuredClone(conf.scriptSettings);

	//Delete data that does not need to be saved
	for(let ssk in scriptSettingsCopy) for(let ssk2 in scriptSettingsCopy[ssk])
		if(ssk2 != 'value') delete scriptSettingsCopy[ssk][ssk2];

	conf.ui.defQueueQty.value = conf.scriptSettings.defaultQty.value; //Update beacuse this one is in two places
	localStorage.awqScriptSettings = JSON.stringify(scriptSettingsCopy);
}

function loadScriptSettings(p_scriptSettings) {
	if(!localStorage.hasOwnProperty("awqScriptSettings") || !isJsonString(localStorage.awqScriptSettings)) return;
	awqLog('Loding saved script settings');

	let savedSettings = p_scriptSettings || JSON.parse(localStorage.awqScriptSettings);
	for(let ssk in conf.scriptSettings) if(savedSettings.hasOwnProperty(ssk))
		conf.scriptSettings[ssk].value = savedSettings[ssk].value;
}

function openSettings() {
	let dialog = utils.mkDiv(utils.mkDiv(document.body, 'awq-popup')),
	hdr = utils.mkDiv(dialog, 'awq-hdr'), body = utils.mkDiv(dialog, 'awq-settings')
	utils.mkDiv(hdr, null, null, "<b>SDAtom Settings</b> - <i>Hold your mouse over an item for a description</i>");
	let close = utils.mkDiv(hdr, null, {float:'right', textShadow:'#292929 2px 3px 5px', cursor:'pointer'}, '⛌');
	close.onclick = () => {dialog.parentElement.remove(); saveScriptSettings()}

	//Create input for each script setting
	for(let ssKey in conf.scriptSettings) {
		let ssObj = conf.scriptSettings[ssKey],
		ssCont = utils.mkDiv(body),
		ssElem = utils.mkEl(ssObj.type=='text'?'textarea':'input');
		ssElem.id = 'awq-ss-' + ssKey;
		ssElem.placeholder = ssObj.name;
		ssElem.value = ssObj.value;
		ssElem.onchange = function() {
			conf.scriptSettings[ssKey].value = ssObj.type == 'boolean' ? this.checked : this.value;
			saveScriptSettings();
		}

		if(ssObj.type == 'boolean') {
			ssElem.type = 'checkbox';
			ssElem.checked = ssObj.value;
		} else if(ssObj.type == 'numeric') {
			ssElem.type = 'number', ssElem.inputmode = 'numeric';
			ssElem.onkeypress = e => {if(e.key.match(/\D/g)) e.preventDefault()}
		}

		let cbLabel = utils.mkEl('label', ssCont, null, null, ssObj.name);
		cbLabel.for = ssElem.id, cbLabel.title = ssObj.description;

		if(ssObj.description.match("http")) {
			let helpLink = utils.mkEl('a', ssCont, null, {textDecoration:'none'}, '❓');
			helpLink.target = '_blank';
			helpLink.href = ssObj.description;
			ssElem.title = ssObj.name;
		} else {
			ssElem.title = ssObj.description;
		}
		ssCont.appendChild(ssElem);
	}

	let importCont = utils.mkDiv(body),
	importBtn = utils.mkEl('button', importCont, null, null, "Import/export");
	importBtn.title = "Import or export all the data for this script (to import add previoiusly exported data to the right, to export leave it empty). Importing data will reload the page!";
	let importData = utils.mkEl('textarea', importCont);
	importData.placeholder = 'Import/export data';
	importData.title = "Exported data will be show here, add data here to import it. Importing data will reload the page!";
	importData.onfocus = () => importData.select();
	importBtn.onclick = () => exportImport(importData);

	//Add replace in queue function GUI
	let replacer = utils.mkDiv(body),
	repLabel = utils.mkEl('label', replacer, null, {display:'block'}, "Search and replace");
	repLabel.title = "Search for values in the queue and replace them with something else";

	//Fetch all attributes and values currently in queue
	let foundAttrs = {}, attrOpts = [];
	conf.currentQueue.map(el => {
		let queueData = JSON.parse(el.value);
		for(let key in queueData) {
			if(!foundAttrs[key]) foundAttrs[key] = {};
			foundAttrs[key][queueData[key]] = '';
		}
	});
	gradio_config.components.forEach(el => {
		if(el.props && el.props.choices) attrOpts.push(el.props.choices);
	});

	utils.mkEl('label', replacer, null, null, "Attribute");
	let repAttr = utils.mkEl('input', replacer);
	repAttr.type = 'text', repAttr.placeholder = '▼';
	repAttr.setAttribute('list', 'awq-rep-attrs');
	repAttr.onfocus = () => repAttr.select();
	let repAttrData = utils.mkEl('datalist'), anyOption = utils.mkEl('option', repAttrData);
	repAttrData.id = 'awq-rep-attrs', anyOption.value = c_any_value;
	for(let key in foundAttrs) utils.mkEl('option', repAttrData).value = key;

	utils.mkEl('label', replacer, null, null, "Old value");
	let repVal = utils.mkEl('input', replacer);
	repVal.type = 'text', repVal.placeholder = '▼';
	repVal.setAttribute('list', 'awq-rep-vals');
	repVal.onfocus = () => repVal.select();
	let repValData = utils.mkEl('datalist');
	repValData.id = 'awq-rep-vals';

	//Update repValData
	(repAttr.onchange = repVal.onchange = () => {
		let foundValues = foundAttrs[repAttr.value];
		repValData.innerHTML = '';
		repValData.appendChild(anyOption.cloneNode());
		if(foundValues) {
			repValData.innerHTML = '';
			repValData.appendChild(anyOption.cloneNode());
			//Add all possible values for currently selected attribute
			for(let key in foundAttrs) utils.mkEl('option', repValData).value = key;
		} else {
			for(let key in foundAttrs) for(let subKey in foundAttrs[key])
				utils.mkEl('option', repValData).value = subKey;
		}
	})();

	utils.mkEl('label', replacer, null, null, "Old value");
	let repNewVal = utils.mkEl('input', replacer);
	repNewVal.type = 'text', repNewVal.placeholder = '▼';
	repNewVal.setAttribute('list', 'awq-rep-newvals');
	repNewVal.onfocus = () => repNewVal.select();
	let repNewValData = utils.mkEl('datalist');
	repNewValData.id = 'awq-rep-newvals';

	//Update repNewValData
	let matchVals = [];
	//Any components that has the option we are trying to replace?
	attrOpts.forEach(arr => {if(arr.includes(repVal.value)) matchVals.push(arr)});
	//If not add all their options
	if(matchVals.length == 0) matchVals = [...attrOpts];
	//Remove duplicates and replace dataset options
	repNewValData.innerHTML = '';
	[...new Set(matchVals.flat())].forEach(el => {utils.mkEl('option', repNewValData).value = el});

	let repBtn = utils.mkEl('button', replacer, null, null, "Replace");
	repBtn.onclick = () => {
		let attributeValue = repAttr.value,
		anyAttribute = attributeValue == c_any_value,
		oldValue = repVal.value,
		anyOldValue = oldValue == c_any_value,
		currentQueue = conf.currentQueue,
		newValue = repNewVal.value;

		for(let key in currentQueue) { //Loop queue entries
			let queueElentry = JSON.parse(currentQueue[key].value);
			if(anyAttribute) {
				for(let subKey in queueElentry) { //Loop queue entry attributes
					if(anyOldValue) {
						//Replace everything with the new value (why are you doing this?)
						if(newValue != queueElentry[subKey]) awqLog(`replaceButton: updated queue item ${key} attribute ${subKey} to ${newValue}`);
						queueElentry[subKey] = newValue;
					} else {
						//Search and replace in all attributes
						let replacedValue = queueElentry[subKey].replaceAll ? queueElentry[subKey].replaceAll(oldValue, newValue) : queueElentry[subKey];
						if(replacedValue != queueElentry[subKey]) awqLog(`replaceButton: updated queue item ${key} attribute ${subKey} to ${replacedValue}`);
						queueElentry[subKey] = replacedValue;
					}
				}
			} else if(anyOldValue) {
				//Replace all values for this attribute
				if(newValue != queueElentry[attributeValue]) awqLog(`replaceButton: updated queue item ${key} attribute ${attributeValue} to ${newValue}`);
				queueElentry[attributeValue] = newValue;
			} else {
				//Replace string in specific attribute
				let replacedValue = queueElentry[attributeValue].replaceAll(oldValue, newValue);
				if(replacedValue != queueElentry[attributeValue]) awqLog(`replaceButton: updated queue item ${key} attribute ${attributeValue} to ${replacedValue}`);
				queueElentry[attributeValue] = replacedValue;
			}
			currentQueue[key].value = JSON.stringify(queueElentry);
		}

		//Update state
		let queueElems = conf.ui.queueCont.querySelectorAll('.AWQ-item-JSON');
		for(let i = 0; i < currentQueue.length; ++i) queueElems[i].value = currentQueue[i].value;
		updateQueueState();
	}

	//Custom code for opacity button
	let opacityBtn = body.querySelector('#awq-ss-buttonOpacity');
	opacityBtn.type = 'range';
	opacityBtn.min = 0, opacityBtn.max = 1, opacityBtn.step = .1;
	opacityBtn.onchange = () => {document.querySelector('.AWQ-overlay').style.opacity =
		conf.scriptSettings.buttonOpacity.value = opacityBtn.value}
}

function toggleProcessButton(p_set_processing) {
	let oldState = conf.commonData.processing;
	if(p_set_processing == null) p_set_processing = !oldState;
	else if(p_set_processing == oldState || conf.scriptSettings.stayReady.value) return;
	awqLog(`toggleProcessButton:${p_set_processing}`);
	let pb = conf.ui.processBtn;
	if(p_set_processing) {
		awqLogPublishMsg('Processing <b>started</b>');
		conf.commonData.processing = true;
		pb.style.background = 'green', pb.innerHTML = '⏸︎ ';
		utils.mkDiv(pb, null, {display:'inline-block'}, '⚙️');
		executeAllNewTasks();
	} else {
		awqLogPublishMsg('Processing <b>ended</b>');
		conf.commonData.processing = conf.commonData.working = false;
		conf.commonData.previousTaskStartTime = pb.style.background = null;
		pb.innerHTML = c_processButtonText;
	}
}

function updateQueueState() {
	let queue = conf.ui.queueCont.getElementsByTagName('div');
	awqLog('updateQueueState: old length:' + conf.currentQueue.length + ' new length:' + queue.length);

	let newArray = [];
	for(let i = 0; i < queue.length; ++i) {
		let newRowObject = {};
		newRowObject.rowid = i;
		newRowObject.type = queue[i].querySelector('.AWQ-item-type').value;
		newRowObject.qty = queue[i].querySelector('.AWQ-item-qty').value;
		newRowObject.value = queue[i].querySelector('.AWQ-item-JSON').value;
		newArray.push(newRowObject);
	}
	conf.currentQueue = newArray;
	if(conf.scriptSettings.rememberQueue.value) {
		awqLog('updateQueueState: Saving current queue state ' + conf.currentQueue.length);
		localStorage.awqCurrentQueue = JSON.stringify(conf.currentQueue);
	} else {
		awqLog('updateQueueState: Cleared current queue state');
		localStorage.removeItem("awqCurrentQueue");
	}
}

let stuckProcessingCounter = 0;
function updateStatus() {
	//Get old & new activeType
	let previousType = conf.commonData.activeType,
	newType = conf.commonData.activeType =
		conf.commonData.i2iContainer.el.style.display !== 'none' ? 'i2i' :
		conf.commonData.t2iContainer.el.style.display !== 'none' ? 't2i' :
		conf.commonData.extContainer.el.style.display !== 'none' ? 'ext' :
		conf.extensions.iBrowser && conf.extensions.iBrowser.guiElems
		.iBrowserContainer.el.style.display !== 'none' ? 'iBrowser' : 'other';

	if(newType !== previousType) {
		awqLog('updateStatus: active type changed to: ' + newType);
		conf.ui.overlay.style.display = conf.ui.msgBox.style.display = newType === 'other' ? 'none' : '';
	}

	if(conf.commonData.processing && !conf.commonData.working && !conf.commonData.previousTaskStartTime)
		executeAllNewTasks();

	if(conf.commonData.waiting || conf.commonData.working || !conf.commonData.processing)
		stuckProcessingCounter = 0;
	else if(!conf.scriptSettings.stayReady.value && ++stuckProcessingCounter > 30) {
		//If no work is being done for a while disable queue
		awqLog('updateStatus: stuck in processing queue status? Disabling queue processing');
		toggleProcessButton(false);
		stuckProcessingCounter = 0;
		playWorkCompleteSound();
	}
}

async function executeAllNewTasks() {
	while(conf.commonData.processing) {
		//awqLog('executeNewTask: working='+conf.commonData.working);
		if(conf.commonData.working) return; //Already working on task

		if(conf.commonData.previousTaskStartTime) {
			let timeSpent = Date.now() - conf.commonData.previousTaskStartTime;
			awqLogPublishMsg(`Completed work on queue item after ${Math.floor(timeSpent / 1000 / 60)} minutes ${Math.round((timeSpent - Math.floor(timeSpent / 60000) * 60000) / 1000)} seconds`);
		}

		let queue = conf.ui.queueCont.getElementsByTagName('div');
		for(let i = 0; i < queue.length; ++i) {
			let itemQty = queue[i].querySelector('.AWQ-item-qty'),
			itemType = queue[i].querySelector('.AWQ-item-type').value;
			if(itemQty.value > 0) {
				awqLog(`executeNewTask: found next work item with index ${i}, qty ${itemQty.value} and type ${itemType}`);
				conf.commonData.working = true;
				await loadJson(queue[i].querySelector('.AWQ-item-JSON').value);
				await clickStartButton(itemType);
				itemQty.value = itemQty.value - 1;
				itemQty.onchange();
				awqLogPublishMsg(`Started working on ${itemType} queue item ${i + 1} (${itemQty.value} more to go) `);
				conf.commonData.previousTaskStartTime = Date.now();
				await waitForTaskToComplete(itemType);
				queue = true;
				break;
			}
		}

		//No more tasks to process
		if(queue !== true) {
			if(conf.commonData.previousTaskStartTime) {
				conf.commonData.previousTaskStartTime = null;
				awqLog('executeNewTask: No more tasks found');
				playWorkCompleteSound();
				toggleProcessButton(false);
			}
			return;
		}
	}
}

function playWorkCompleteSound() {if(conf.scriptSettings.notificationSound.value) c_audio_base64.play()}

function editSetting() {
	let setStore = conf.ui.settingsStorage, setIdx = setStore.selectedIndex,
	setOpt = setStore.options[setIdx], setKey = setOpt.innerHTML;
	if(setKey == c_defaultTextStoredSettings) return;
	awqLog('editSettings: index' + setIdx);

	//TODO Add to stylesheet instead of fixed style
	document.body.style.overflow = 'hidden';
	let editCont = utils.mkDiv(document.body, null, {position:'fixed', left:0,
		bottom:0, width:'100vw', height:'100vh', background:'#000', zIndex:9999});

	let txtInput = utils.mkEl('input', editCont, null, {width:'100vw', height:'10vh'});
	txtInput.title = "Name of the settins set (do not remove the prefix)";

	let txtArea = utils.mkEl('textarea', editCont, null, {width:'100vw', height:'80vh'});
	txtArea.title = `The set of settings i JSON format (Edit the value inside the "" but leave structure intact, an entire propertey: "id":"value" can also be removed if you do not want this setting set to make any changes to that setting)`;

	let editBtn = utils.mkEl('button', editCont, null, {width:'50vw', height:'10vh'}, "OK");
	editBtn.title = "Save changes";
	editBtn.onclick = () => {
		//Validate
		if(txtInput.value.length < 1) return alert('Name is missing');
		if(!isJsonString(txtArea.value)) return alert('Value is invalid JSON');
		if(!['t2i-', 'i2i-', 'ext-'].includes(txtInput.value.slice(0, 4)))
			return alert('Name does not have valid prefix (t2i-, i2i-, ext-)');

		//Remove overlay
		document.body.style.overflow = '';
		editCont.remove();

		//Update data and refresh UI
		awqLog(`editSettings: updating ${setKey} ${setKey==txtInput.value?'':' to '+txtInput.value}`);
		delete conf.savedSetting[setKey];
		conf.savedSetting[txtInput.value] = txtArea.value;
		localStorage.awqSavedSetting = JSON.stringify(conf.savedSetting);
		refreshSettings();

		//Select option again
		let opt = Array.from(setStore.options).find(item => item.text === txtInput.value);
		opt.selected = true;
	}

	let rstBtn = utils.mkEl('button', editCont, null, {width:'50vw', height:'10vh'}, "Reset");
	rstBtn.title = "Revert changes";
	(rstBtn.onclick = () => {
		txtArea.value = conf.ui.settingsStorage.options[setIdx].value;
		txtInput.value = conf.ui.settingsStorage.options[setIdx].text;
	})();
}

function saveSettings() {
	if(conf.ui.settingName.value.length < 1) return alert('Missing name');
	if(conf.savedSetting.hasOwnProperty(conf.ui.settingName.value)) return alert('Duplicate name');
	let settingSetName = conf.commonData.activeType + '-' + conf.ui.settingName.value;
	conf.savedSetting[settingSetName] = getValueJSON();
	localStorage.awqSavedSetting = JSON.stringify(conf.savedSetting);
	awqLogPublishMsg(`Saved new setting set ` + settingSetName);
	refreshSettings();
}
function refreshSettings() {
	awqLog('refreshSettings: saved settings:' + Object.keys(conf.savedSetting).length);
	conf.ui.settingName.value = conf.ui.settingsStorage.innerHTML = "";
	for(let prop in conf.savedSetting) utils.mkEl('option',
		conf.ui.settingsStorage, null, null, prop).value = conf.savedSetting[prop];
	if(Object.keys(conf.savedSetting).length < 1) utils.mkEl('option',
		conf.ui.settingsStorage, null, null, c_defaultTextStoredSettings).value = "";
}
async function loadSetting() {
	if(conf.ui.settingsStorage.value.length < 1) return;
	let itemName = conf.ui.settingsStorage.options[conf.ui.settingsStorage.selectedIndex].text;
	let itemType = itemName.split('-')[0];
	awqLog('loadSetting: ' + itemName);
	await loadJson(conf.ui.settingsStorage.value);
}
function clearSetting() {
	let ss = conf.ui.settingsStorage;
	if(ss.value.length < 1) return;
	awqLogPublishMsg(`Removed setting ` + ss.options[ss.selectedIndex].innerHTML);
	delete conf.savedSetting[ss.options[ss.selectedIndex].innerHTML];
	ss.options[ss.selectedIndex].remove();
	localStorage.awqSavedSetting = JSON.stringify(conf.savedSetting);
	if(ss.value.length < 1) refreshSettings();
}

function clickStartButton(p_type) {
	const c_max_time_to_wait = 100;
	let targetButton = conf[conf.commonData.activeType].controls.genrateButton.el;
	awqLog(`clickStartButton: working ${conf.commonData.working} waiting ${conf.commonData.working} type ${p_type}`);
	if(conf.commonData.waiting) return;
	targetButton.click();
	conf.commonData.waiting = true;
	return new Promise(resolve => {
		let retryCount = 0;
		let waitForSwitchInterval = setInterval(() => {
			++retryCount;
			if(retryCount >= c_max_time_to_wait) {
				targetButton.click(); retryCount = 0;
				awqLog(`Work has not started after ${c_max_time_to_wait / 10} seconds, clicked again`);
			}
			if(!webUICurrentyWorkingOn(p_type)) return;
			conf.commonData.waiting = false;
			awqLog('clickStartButton: work has started');
			clearInterval(waitForSwitchInterval);
			resolve();
		}, c_wait_tick_duration);
	});
}

function switchTabAndWait(p_type) {
	if(p_type == conf.commonData.activeType) return;
	awqLog('switchTabAndWait: ' + p_type);
	conf.shadowDOM.root.querySelector(conf[p_type].controls.tabButton.sel).click(); //Using .el doesn't work
	conf.commonData.waiting = true;
	return new Promise(resolve => {
		let startingTab = conf.commonData.activeType;
		let waitForSwitchInterval = setInterval(() => {
			if(conf.commonData.activeType !== p_type) return;
			conf.commonData.waiting = false;
			awqLogPublishMsg(`Switched active tab from ${startingTab} to ${conf.commonData.activeType}`);
			clearInterval(waitForSwitchInterval);
			resolve();
		}, c_wait_tick_duration);
	});
}

function switchTabAndWaitUntilSwitched(p_targetTabName, p_tabConfig) {
	awqLog('switchTabAndWaitUntilSwitched: p_target=' + p_targetTabName + ' p_config=' + p_tabConfig);
	let targetTabConf = p_tabConfig.filter((elem) => {return elem.name == p_targetTabName})[0];
	function correctTabVisible() {
		return conf.shadowDOM.root.querySelector(targetTabConf.containerSel).style.display != 'none';
	}
	if(correctTabVisible()) return;
	conf.shadowDOM.root.querySelector(targetTabConf.buttonSel).click();
	conf.commonData.waiting = true;
	return new Promise(resolve => {
		let waitForSwitchInterval = setInterval(() => {
			if(!correctTabVisible()) return;
			conf.commonData.waiting = false;
			awqLog('switchTabAndWaitUntilSwitched: switch complete');
			clearInterval(waitForSwitchInterval);
			resolve();
		}, c_wait_tick_duration);
	});
}

function forceGradioUIUpdate() {
	const someCheckboxInputSelector = '#txt2img_subseed_show input';
	document.querySelector(someCheckboxInputSelector).click();
	document.querySelector(someCheckboxInputSelector).click();
}

function webUICurrentyWorkingOn(p_itemType) {
	if(p_itemType == 'i2i' || p_itemType == 't2i')
		return conf[p_itemType].controls.skipButton.el.getAttribute('style') == 'display: block;';
	return conf.ext.controls.loadingElement.el.innerHTML.length > 0;
}

function waitForTaskToComplete(p_itemType) {
	awqLog(`waitForTaskToComplete: Waiting to complete work for ${p_itemType}`);
	conf.commonData.waiting = true;
	return new Promise(resolve => {
		let waitForCompleteInterval = setInterval(() => {
			if(webUICurrentyWorkingOn(p_itemType)) return;
			clearInterval(waitForCompleteInterval);
			awqLog(`Work is complete for ${p_itemType}`);
			conf.commonData.waiting = conf.commonData.working = false;
			resolve();
		}, c_wait_tick_duration);
	});
}

function filterPrompt(p_prompt_text, p_neg) {
	let newPromptText = p_prompt_text;
	let promptFilter = conf.scriptSettings.promptFilter.value.length > 0 ?
		JSON.parse(conf.scriptSettings.promptFilter.value) : [];

	for(let i = 0; i < promptFilter.length; ++i) {
		if(!promptFilter[i].hasOwnProperty('pattern') ||
			!promptFilter[i].hasOwnProperty('flags') ||
			!promptFilter[i].hasOwnProperty('replace')) continue;

		let regEx = new RegExp(promptFilter[i].pattern, promptFilter[i].flags);
		let tmpNewPromptText = newPromptText.replace(regEx, promptFilter[i].replace);
		if(tmpNewPromptText !== newPromptText) {
			let changesCount = levenshteinDist(newPromptText, tmpNewPromptText);
			awqLogPublishMsg(`Filtered ${p_neg ? '(neg)' : ''}prompt with filter (${promptFilter[i].desc}), ${changesCount} char changes`);
			awqLog(`Filtered from:<pre>${newPromptText}</pre>to:<pre>${tmpNewPromptText}</pre>`);
			newPromptText = tmpNewPromptText;
		}
	}
	return newPromptText;
}

function exportImport(input) {
	let exportJSON = JSON.stringify({
		savedSetting: conf.savedSetting,
		currentQueue: conf.currentQueue,
		scriptSettings: JSON.parse(localStorage.awqScriptSettings) //Use localstorage since it has filtered everything except values
	});
	let importJSON = input.value;
	if(importJSON.length < 1) {
		awqLogPublishMsg(`Exported script data`);
		input.value = exportJSON;
		input.focus(), input.select();
		return;
	}
	if(!isJsonString(importJSON)) return alert(`There is something wrong with the import data provided`);
	if(exportJSON == importJSON) return alert(`The input data is the same as the current script data`);
	awqLog('Data has changed');
	let parsedImportJSON = JSON.parse(importJSON);
	conf.savedSetting = parsedImportJSON.savedSetting;
	conf.currentQueue = parsedImportJSON.currentQueue;
	loadScriptSettings(parsedImportJSON.scriptSettings); //Load with loadScriptSettings to only replace values
	localStorage.awqScriptSettings = JSON.stringify(parsedImportJSON.scriptSettings);
	localStorage.awqSavedSetting = JSON.stringify(conf.savedSetting);
	localStorage.awqCurrentQueue = JSON.stringify(conf.currentQueue);
	location.reload();
}
function isJsonString(str) {
	try {JSON.parse(str)} catch(e) {return false}
	return true;
}
function getCallStack() {
	try {throw new Error()}
	catch(err) {return err.stack.replace(/^getCallStack.*\n/, '')}
}

function levenshteinDist(s1, s2) {
	if(s1 === s2) return 0;
	else {
		let s1_len = s1.length, s2_len = s2.length;
		if(s1_len && s2_len) {
			let i1 = 0, i2 = 0, a, b, c, c2, row = [];
			while(i1 < s1_len) row[i1] = ++i1;
			while(i2 < s2_len) {
				c2 = s2.charCodeAt(i2);
				a = i2;
				++i2;
				b = i2;
				for(i1 = 0; i1 < s1_len; ++i1) {
					c = a + (s1.charCodeAt(i1) === c2 ? 0 : 1);
					a = row[i1];
					b = b < a ? (b < c ? b + 1 : c) : (a < c ? a + 1 : c);
					row[i1] = b;
				}
			}
			return b;
		} else return s1_len + s2_len;
	}
}

function getValueJSON(p_type) {
	let type = p_type || conf.commonData.activeType;
	awqLog('getValueJSON: type=' + type);
	let valueJSON = {type: type};

	if(type == 'ext') { //Needs special saving since it's not an input but a tab switch
		valueJSON.extrasMode = conf.ext.controls.extrasMode.filter((elem) => {
			return conf.shadowDOM.root.querySelector(elem.containerSel).style.display != 'none'
		})[0].name;
		valueJSON.extrasResizeMode = conf.ext.controls.extrasResizeMode.filter((elem) => {
			return conf.shadowDOM.root.querySelector(elem.containerSel).style.display != 'none'
		})[0].name;
	} else if(type == 'i2i') { //Needs special saving since it's not an input but a tab switch
		valueJSON.i2iMode = conf.i2i.controls.i2iMode.filter((elem) => {
			return conf.shadowDOM.root.querySelector(elem.containerSel).style.display != 'none'
		})[0].name;
	} else if(type == 'iBrowser') {
		return conf.extensions.iBrowser.functions.getValueJSON();
	}

	for(let prop in conf[type]) {
		if(prop !== 'controls') {
			try {
				if(conf[type][prop].gradEl) {
					valueJSON[prop] = getGradVal(conf[type][prop].gradEl);
				} else if(conf[type][prop].el.classList.contains('input-accordion')) { //"input-accordion" (checkbox alternative)
					valueJSON[prop] = conf[type][prop].el.classList.contains('input-accordion-open');
				} else if(conf[type][prop].el.type == 'fieldset') { //Radio buttons
					valueJSON[prop] = conf[type][prop].el.querySelector('input:checked').value;
				} else if(conf[type][prop].el.type == 'checkbox') {
					valueJSON[prop] = conf[type][prop].el.checked;
				} else { //Inputs, Textarea
					valueJSON[prop] = conf[type][prop].el.value;
					if(prop == 'prompt') valueJSON[prop] = filterPrompt(valueJSON[prop]);
					if(prop == 'negPrompt' && conf.scriptSettings.promptFilterNegative.value) valueJSON[prop] = filterPrompt(valueJSON[prop], true);
				}
			} catch(e) {
				awqLogPublishError(`Failed to retrieve settings for ${type} item ${prop} with error ${e.message}: <pre style="margin: 0;">${e.stack}</pre>`);
			}
		}
	}

	valueJSON.sdModelCheckpoint = getGradVal(conf.commonData.sdModelCheckpoint.gradEl);
	return JSON.stringify(valueJSON);
}
async function loadJson(p_json) {
	let inputJSONObject = JSON.parse(p_json);
	let type = inputJSONObject.type ? inputJSONObject.type : conf.commonData.activeType;
	let oldData = JSON.parse(getValueJSON(type));
	awqLog('loadJson: ' + type);

	let currentModel = getGradVal(conf.commonData.sdModelCheckpoint.gradEl);
	if(currentModel == inputJSONObject.sdModelCheckpoint) {
		awqLog('loadJson: Correct model already loaded: ' + currentModel);//No action needed
	} else if(conf.commonData.sdModelCheckpoint.gradEl.props.choices.includes(inputJSONObject.sdModelCheckpoint)) { //Check if model exists
		awqLog('loadJson: Trying to load model: ' + inputJSONObject.sdModelCheckpoint);
		setGradVal(conf.commonData.sdModelCheckpoint.gradEl, inputJSONObject.sdModelCheckpoint);
		setCheckpointWithPost(inputJSONObject.sdModelCheckpoint); //Only setting gradio config no longer works?
	} else {
		awqLogPublishError(`Model ${inputJSONObject.sdModelCheckpoint} was not found, using current model ${currentModel}`);
	}

	if(conf.commonData.activeType != inputJSONObject.type) await switchTabAndWait(inputJSONObject.type); //Switch tab?

	if(inputJSONObject.extrasResizeMode) await switchTabAndWaitUntilSwitched(inputJSONObject.extrasResizeMode, conf.ext.controls.extrasResizeMode); //Needs special loading since it's not an input but a tab switch
	if(inputJSONObject.extrasMode) await switchTabAndWaitUntilSwitched(inputJSONObject.extrasMode, conf.ext.controls.extrasMode); //Needs special loading since it's not an input but a tab switch

	if(inputJSONObject.i2iMode) await switchTabAndWaitUntilSwitched(inputJSONObject.i2iMode, conf.i2i.controls.i2iMode); //Needs special loading since it's not an input but a tab switch

	let loadOutput = 'loadJson: loaded: ';

	for(let prop in inputJSONObject) {
		let triggerOnBaseElem = true;
		if(['type', 'extrasMode', 'extrasResizeMode', 'sdModelCheckpoint', 'i2iMode'].includes(prop)) continue;
		try {
			if(oldData[prop] != inputJSONObject[prop]) loadOutput += `${prop}:${oldData[prop]}-->${inputJSONObject[prop]} | `;

			if(conf[type][prop].el) {
				if(conf[type][prop].el.type == 'fieldset') {
					triggerOnBaseElem = false; //No need to trigger this on base element
					conf[type][prop].el.querySelector('[value="' + inputJSONObject[prop] + '"]').checked = true;
					triggerChange(conf[type][prop].el.querySelector('[value="' + inputJSONObject[prop] + '"]'));
				} else if(conf[type][prop].el.classList.contains('input-accordion')) { //"input-accordion" (checkbox alternative)
					let currentValue = conf[type][prop].el.classList.contains('input-accordion-open');
					if(inputJSONObject[prop] != currentValue) {
						conf[type][prop].el.querySelector('.label-wrap').click();
					}

				} else if(conf[type][prop].el.type == 'select-one') { //Select
					if(conf[type][prop].el.checked == inputJSONObject[prop]) triggerOnBaseElem = false; //Not needed
					conf[type][prop].el.value = inputJSONObject[prop];
				} else if(conf[type][prop].el.type == 'checkbox') {
					if(conf[type][prop].el.checked == inputJSONObject[prop]) triggerOnBaseElem = false; //Prevent checbox getting toggled
					conf[type][prop].el.checked = inputJSONObject[prop];
				} else { //Input, Textarea
					if(conf[type][prop].el.value == inputJSONObject[prop]) triggerOnBaseElem = false; //Fixes svelte error
					conf[type][prop].el.value = inputJSONObject[prop];
				}
				if(conf[type][prop].el2) {
					let triggerForSel2 = conf[type][prop].sel2.value != inputJSONObject[prop];
					conf[type][prop].el2.value = inputJSONObject[prop];
					if(triggerForSel2) triggerChange(conf[type][prop].el2);
				}
			}
			if(conf[type][prop].gradEl) {
				setGradVal(conf[type][prop].gradEl, inputJSONObject[prop]);
				triggerOnBaseElem = false;
			}
			if(triggerOnBaseElem) triggerChange(conf[type][prop].el);
		} catch(e) {
			awqLogPublishError(`Failed to load settings for ${type} item ${prop} with error ${e.message}: <pre style="margin: 0;">${e.stack}</pre>`);
		}
	}
	awqLog(loadOutput.replace(/\|\s$/, ''));
	forceGradioUIUpdate();
}

function waitForElm(selector) {
	return new Promise(resolve => {
		if(document.querySelector(selector)) {
			return resolve(document.querySelector(selector));
		}

		const observer = new MutationObserver(mutations => {
			if(document.querySelector(selector)) {
				resolve(document.querySelector(selector));
				observer.disconnect();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	});
}
function setCheckpointWithPost(p_target_cp) {
	awqLog('setCheckpointWithPost: ' + p_target_cp);
	let targetCheckpoint = p_target_cp.replace('/', '//').replace('\\', '\\\\');

	//Try to find fn_index for the switch checkpoint "function"
	let checkPointGradioElemId = conf.commonData.sdModelCheckpoint.gradEl.id;
	let fnIndex = gradio_config.dependencies.filter(comp => comp.inputs[0] == checkPointGradioElemId);
	fnIndex = fnIndex ? gradio_config.dependencies.indexOf(fnIndex[0]) : null;
	if(fnIndex) {
		awqLog('setCheckpointWithPost: found fn_index ' + fnIndex);
	} else {
		awqLogPublishError('setCheckpointWithPost: failed to find fn_index for model change');
		return;
	}

	fetch("/run/predict", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		redirect: "follow",
		body: `{"fn_index":${fnIndex},"data":["${targetCheckpoint}"],"event_data":null,"session_hash":"trlwn215an"}`
	}).then(response => {
		awqLog(`setCheckpointWithPost: repsonse: ${response.status}-${response.statusText}: ${JSON.stringify(response.json())}`);
	}).catch(error => {
		awqLog(`setCheckpointWithPost: error: ${JSON.stringify(error)}`);
	});;
}

function triggerChange(p_elem) {
	let evt = document.createEvent("HTMLEvents");
	evt.initEvent("change", false, true); //Needed for script to update subsection
	p_elem.dispatchEvent(evt);
	evt = document.createEvent("HTMLEvents");
	evt.initEvent("input", false, true); //Needded for webui to register changed settings
	p_elem.dispatchEvent(evt);
}

function findGradioComponentState(p_elem_id) {
	return gradio_config.components.filter(comp => comp.props.elem_id == p_elem_id);
}
function findGradioComponentStateByLabel(p_elem_label) {
	return gradio_config.components.filter(comp => comp.props.label == p_elem_label);
}
function getGradVal(p_grad_comp) {
	return p_grad_comp.props.value;
}
function setGradVal(p_grad_comp, p_val) {
	p_grad_comp.props.value = p_val;
}

})();