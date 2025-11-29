//==UserScript==
//@name         SDAtom-WebUi-us
//@namespace    SDAtom-WebUi-us
//@version      1.5.0
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

const Ver = typeof GM_info == 'undefined' ? '1.3.2' : GM_info.script.version,
Handler = typeof GM_info == 'undefined' ? '(not user script)' : GM_info.scriptHandler;

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

const TickDelay = 200,
WaitForStart = 10000,
AnyValue = "<ANY VALUE>",
EmptyQueueTxt = "Queue is empty",
AddQueueTxt = "Add to queue",
AddQueueDesc = "You can also use ALT + Q",
AddQueueDescAlt = "Override w/ alt preset; You can also use ALT + ",
ProcessTxt = "Process Queue",
AltOpts = {description: "When Alt key is pressed, current generation settings are added to the queue, but with the overrides below applied", type: 'json'},
Conf = {
	shadowDOM: {sel: "gradio-app"},
	common: {
		t2iContainer: {sel: "#tab_txt2img"},
		i2iContainer: {sel: "#tab_img2img"},
		extContainer: {sel: "#tab_extras"},
		sdModelCheckpoint: {grad: "setting_sd_model_checkpoint"},
		versionContainer: {sel: "#footer .versions"},
		working: false,
		processing: false,
		waiting: false
	},
	t2i: {
		controls: {
			tabButton: {sel: "#tabs > div:nth-child(1) > button:nth-child(1)"},
			genrateButton: {sel: "#txt2img_generate"},
			skipButton: {sel: "#txt2img_skip"}
		},
		prompt: {sel: "#txt2img_prompt textarea"},
		negPrompt: {sel: "#txt2img_neg_prompt textarea"},
		sample: {sel: "#txt2img_steps [id^=range_id]", sel2: "#txt2img_steps input"},
		sampleMethod: {grad: "txt2img_sampling"},
		width: {sel: "#txt2img_width [id^=range_id]", sel2: "#txt2img_width input"},
		height: {sel: "#txt2img_height [id^=range_id]", sel2: "#txt2img_height input"},
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
		scriptXYZGridMargin: {sel: "#script_txt2img_xyz_plot_margin_size [id^=range_id]", sel2: "#script_txt2img_xyz_plot_margin_size input"}
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
				{name: "batch", buttonSel: "#mode_img2img button:nth-child(6)", containerSel: "#img2img_batch_tab"}
			]
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
		scriptSDUpUpcaler: {sel: "#script_sd_upscale_upscaler_index"}
	},
	ext: {
		controls: {
			tabButton: {sel: "#tabs > div:nth-child(1) > button:nth-child(3)"},
			genrateButton: {sel: "#extras_generate"},
			loadingElement: {sel: "#html_info_x_extras .wrap"},
			extrasResizeMode: [
				{name: "scaleBy", buttonSel: "#extras_resize_mode button:nth-child(1)", containerSel: "#extras_scale_by_tab"},
				{name: "scaleTo", buttonSel: "#extras_resize_mode button:nth-child(2)", containerSel: "#extras_scale_to_tab"}
			],
			extrasMode: [
				{name: "singleImg", buttonSel: "#mode_extras button:nth-child(1)", containerSel: "#extras_single_tab"},
				{name: "batchProcess", buttonSel: "#mode_extras button:nth-child(2)", containerSel: "#extras_batch_process_tab"},
				{name: "batchDir", buttonSel: "#mode_extras button:nth-child(3)", containerSel: "#extras_batch_directory_tab"}
			]
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
		CodeFormWeight: {sel: "#extras_codeformer_weight input", sel2: "#extras_codeformer_weight [id^=range_id]"}
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
				favorites: {sel: '#image_browser_tab_favorites_image_browser_file_info textarea'}
			},
			ui: {},
			text: {
				queueVariationsButtonText: 'Add 5 variations',
				queueHiResVersionButtonText: 'Add HiRes version'
			},
			functions: {
				//Used when loading prompt from image browser
				getValueJSON: () => {
					awqDebug('iBrowser.getValueJSON: parsing data');
					let json = {type: 't2i'}, currentTab = document.querySelector('#image_browser_tabs_container button.selected')
						.innerHTML.replace(/\s/g, '').replace('-grids', 'G').toLowerCase(),
					lines = Conf.extensions.iBrowser.guiElems[currentTab].el.value.split(/\r?\n/),
					whichLine = 0; //0=prompt, 1=negPrompt, 2=template, 3=negTemplate, 4=dictionary
					json.prompt = json.negPrompt = '';

					for(let l of lines) {
						if(l.startsWith("Negative prompt: ")) whichLine = 1, l = l.slice(17);
						else if(l.startsWith("Template: ")) whichLine = 2, l = l.slice(10);
						else if(l.startsWith("Negative Template: ")) whichLine = 3, l = l.slice(19);
						else if(l.startsWith("Steps: ")) whichLine = 4;

						switch(whichLine) {
						case 0:
							json.prompt += l;
							break;
						case 1:
							json.negPrompt += l;
							break;
						case 2: case 3:
							break; //ignore template
						case 4:
							for(let v of l.split(/, /)) {
								let kv = v.split(/: /);
								switch(kv[0]) {
								case "Steps":
									json.sample = kv[1];
									break;
								case "Sampler":
									json.sampleMethod = kv[1];
									break;
								case "CFG scale":
									json.cfg = kv[1];
									break;
								case "Seed":
									json.seed = kv[1];
									break;
								case "Size":
									let wh = kv[1].split(/x/)
									json.width = wh[0];
									json.height = wh[1];
									break;
								case "Model":
									json.sdModelCheckpoint = kv[1];
									break;
								case "Denoising strength":
									json.hrFixdenoise = kv[1];
									break;
								case "Hires upscale":
									json.hrFixUpscaleBy = kv[1];
									json.highresFix = true;
									break;
								case "Hires upscaler":
									json.hrFixUpscaler = kv[1];
								}
							}
						}
					}
					return json;
				}
			}
		}
	},
	ui: {},
	settings: {
		defQty: {name: "Default queue quantity", description: "Default times to execute each queue item", type: 'int', value: 1, min: 1},
		rememberQueue: {name: "Remember queue", description: "Remember the queue if you reload the page", type: 'bool', value: true},
		stayReady: {name: "Stay ready", description: "Remain ready after end-of-queue until manually stopped", type: 'bool', value: false},
		notifSound: {name: "Notification sound", description: "Sound to be played when processing of queue items stops", type: 'bool', value: true},
		extensionScript: {name: "Extension script(s)", description: "https://github.com/Kryptortio/SDAtom-WebUi-us#script-extensions", type: 'text', value: ''},
		filter: {name: "Prompt filter(s)", description: "https://github.com/Kryptortio/SDAtom-WebUi-us#prompt-filter", type: 'json', value: ''},
		filterNeg: {name: "Filter negative prompt", description: "Apply the prompt filter to the negative filter as well", type: 'bool', value: false},
		autoscroll: {name: "Autoscroll console", description: "Scroll console automatically when new lines appear", type: 'bool', value: true},
		verbose: {name: "Verbose console", description: "Log as much as possible to the console", type: 'bool', value: false},
		maxQueue: {name: "Max queue items", description: "Max items to retain in the queue before deleting them, oldest-first", type: 'int', value: 20, min: 1},
		maxLines: {name: "Max console lines", description: "Maximum lines to retrain in the console box", type: 'int', value: 500, min: 1},
		A1: {name: "Alt 1 override", ...AltOpts, value: {width:768, height:768}},
		A2: {name: "Alt 2 override", ...AltOpts, value: {width:1024, height:1024}},
		A3: {name: "Alt 3 override", ...AltOpts, value: {sample:20, sampleMethod:"Euler a", width:512, height:512, restoreFace:false, tiling:false,
			batchCount:1, batchSize:1, cfg:7, seed:-1, extra:false, varSeed:-1, varStr:0}},
		opacity: {name: "Button transparency", description: "Adjust opacity of the floating queue buttons", type: 'range', value: .7}
	},
	presets: JSON.parse(localStorage.awqPresets || '{}'),
	savedQueue: JSON.parse(localStorage.awqQueue || '[]')
}

const DoneAudio = new Audio('data:audio/mpeg;base64,//PkZAAAAAGkAAAAAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//PkZAAAAAGkAAAAAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVR9DU02wxI2HBY0xzzTPHVjsaEggIYbBQymbZ5et+lSLLDAPL2LcegkDNlkiLYgIBgMoIRxodnFVNMu2pmYwSfDSC2CxTFDKowcoycCimGKGFhYRCx50EjDS05dCEXJaIRTRHMTQfkO/U/sjuSEa5wroVM0a2hmXr0oA7JasD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V///+YGDIYDB4HGBRAYjCABAQMAOrVXeNb/////QYBwSBIETHQhBgBRAMGgq1lV3jW13f//////ogl+UTWeJbqBIMiQBa6X2STL/Y1tdq75lrtXf///////44AURAYAVhE+lMmFrcRNYQqJhyhq4FhWjY1tdx/mWu475lrv//////////rTVMnql4XBZApWX+aWuRL1jSmZf5pbEEvXQWDS+Z+yzHfK2u1d8y12rtFKTRUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//PkZAAAAAGkAOAAAAAAA0gBwAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');

//----------------------------------------------------------------------------- Logging
function preAwqLog(msg) {console.info(`SDAtom-WebUi-us: ${msg}`)}
function awqDebug(msg, force) {awqLog(msg, 0, 1, force)}
function awqErr(msg) {awqLog(msg, 'red')}
function awqLog(msg, color, isDbg, force) {
	if(!Conf.ui.msgConsole) return preAwqLog(msg);
	if(isDbg && !(force || Conf.settings.verbose.value)) return;
	let ts = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false});
	msg = utils.mkEl(isDbg?'span':'div', Conf.ui.msgConsole, null, null, `${ts}: ${msg}`);
	if(color) msg.style.color = color;
	if(Conf.ui.msgConsole.childElementCount >= Conf.settings.maxLines.value) Conf.ui.msgConsole.firstChild.remove();
	if(Conf.settings.autoscroll.value) Conf.ui.msgConsole.scrollTo(0, Conf.ui.msgConsole.scrollHeight);
}

//----------------------------------------------------------------------------- Wait for content to load
let waitForLoadInterval = setInterval(initAWQ, TickDelay);
function initAWQ() {
	Conf.shadowDOM.root = document.querySelector(Conf.shadowDOM.sel);
	if(!Conf.shadowDOM.root || !Conf.shadowDOM.root.querySelector('#txt2img_prompt')) return;
	clearInterval(waitForLoadInterval);

	Conf.common.versionContainer.el = Conf.shadowDOM.root.querySelector('#footer .versions');

	//Check for extensions
	for(let ext in Conf.extensions) {
		if(!document.querySelector(Conf.extensions[ext].existCheck.sel)) {
			preAwqLog(`Extension ${Conf.extensions[ext].name} not found, disabling`);
			Conf.extensions[ext] = false;
		} else {
			preAwqLog(`Extension ${Conf.extensions[ext].name} found`);
		}
	}

	mapElementsToConf(Conf.common, 'main object');
	mapElementsToConf(Conf.t2i, 't2i object');
	mapElementsToConf(Conf.t2i.controls, 't2i control');
	mapElementsToConf(Conf.i2i, 'i2i object');
	mapElementsToConf(Conf.i2i.controls, 'i2i control');
	mapElementsToConf(Conf.ext, 'ext object');
	mapElementsToConf(Conf.ext.controls, 'ext control');
	if(Conf.extensions.iBrowser) waitForElm(Conf.extensions.iBrowser.guiElems.txt2img.sel)
		.then(() => mapElementsToConf(Conf.extensions.iBrowser.guiElems, 'iBrowser objects'));

	loadScriptSettings();
	generateMainUI();

	try {eval(Conf.settings.extensionScript.value)} catch(e) {awqLog(`Failed to load extension script, error: <pre>${
		e.message} l=${e.lineNumber} c=${e.columnNumber}\n${e.stack}</pre>`, 'darkorange')}

	setInterval(updateStatus, TickDelay);
}

function mapElementsToConf(object, info) {
	for(let prop in object) {
		if(object[prop].sel) {
			object[prop].el = Conf.shadowDOM.root.querySelector(object[prop].sel);
			if(!object[prop].el) awqErr(`Failed to find the ${info} ${prop}`);
		}
		if(object[prop].sel2) {
			object[prop].el2 = Conf.shadowDOM.root.querySelector(object[prop].sel2);
			if(!object[prop].el2) awqErr(`Failed to find the secondary ${info} ${prop}`);
		}
		if(object[prop].grad) {
			let gradIndex = object[prop].gradIndex ? object[prop].gradIndex : 0;
			object[prop].gradEl = findGradioComponentState(object[prop].grad)[gradIndex];
			if(!object[prop].gradEl) awqErr(`Failed to find the gradio element ${info} ${prop}`);
		}
		if(object[prop].gradLab) {
			object[prop].gradEl = findGradioComponentStateByLabel(object[prop].gradLab)[0];
			if(!object[prop].gradEl) awqErr(`Failed to find the gradio element ${info} ${prop}`);
		}
	}
}

function appendQueueBtn(parent, name, onclick, tip) {
	let btn = Conf.ui[name] = utils.mkEl('button', parent, null, null, name);
	btn.onclick = onclick, btn.title = tip;
	return btn;
}

//Respond to shortcut keys
onkeyup = e => {
	if(e.altKey && !e.ctrlKey) {
		let key = e.key, el;
		if(key == 'w') el = Conf.ui.processBtn;
		else if(key == 'c') el = Conf.ui.clearBtn;
		else if(key == 'q') el = Conf.ui[AddQueueTxt];
		else if(Number(key)) el = Conf.ui['A'+key];
		if(el) el.onclick();
	}
}

function generateMainUI() {
	utils.mkEl('style', document.head, null, null, `
:root { color-scheme:dark; }
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
.AWQ-box input::placeholder, .awq-popup input::placeholder,
.awq-popup textarea::placeholder { color:#777; }
.awq-popup :not(button) { color:var(--block-title-text-color); }
.awq-popup, .awq-popup *, .awq-json-editor, .awq-json-editor > * { box-sizing:border-box; }
.awq-popup {
	position:fixed; top:0; left:0; width:100%; height:100%;
	padding:50px 0; z-index:9999; overflow-y:auto;
	background:rgba(0,0,0,.5); font-family:sans-serif;
}
.awq-popup > div {
	width:100%; max-width:1200px; margin:auto; padding:20px;
	border-radius:15px; background:var(--background-fill-primary);
	box-shadow:3px 3px 100px #000, 3px 3px 500px #000, 3px 3px 25px #000;
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
.awq-popup input[type=range] { padding:0; }
.awq-popup button { margin:5px 0; }
.awq-popup button:last-child { margin-bottom:0; }
.awq-popup textarea { min-height:60px; resize:vertical; }

.awq-json-editor {
	position:fixed; top:0; left:0; width:100vw; height:100vh;
	display:flex; flex-direction:column; gap:3px; padding:3px;
	z-index:9999; background:#000;
}
.awq-json-editor > * { width:100%; padding:5px; }
.awq-json-editor input { font-size:24px; }
.awq-json-editor textarea { resize:none; flex-grow:1; }
.awq-json-editor > div { display:flex; gap:3px; padding:0; }
.awq-json-editor button { height:30px; flex-grow:1; }

.AWQ-box button, .AWQ-overlay button, .awq-popup button {
	display:inline-block; height:25px; cursor:pointer;
	border:var(--button-border-width) solid var(--button-secondary-border-color);
	background:var(--button-secondary-background-fill);
	color:var(--button-secondary-text-color);
	border-radius:var(--input-radius);
	margin-right:5px; padding: 0 5px;
}
.AWQ-console > div {
	height:auto; margin:0; padding:2px;
	border-radius:unset; overflow-wrap:anywhere;
}
.AWQ-console > span { display:block; padding:2px; color:darkgray; }
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
	Conf.ui.msgBox = msgBox;

	let overlay = utils.mkDiv(document.body, 'AWQ-overlay', {opacity:Conf.settings.opacity.value});
	Conf.ui.overlay = overlay;

	appendQueueBtn(overlay, AddQueueTxt, appendQueueItem, AddQueueDesc);
	let qbCont = utils.mkDiv(overlay);
	appendQueueBtn(qbCont, 'A1', () => appendQueueItem(null, null, Conf.settings.A1.value), AddQueueDescAlt+1);
	appendQueueBtn(qbCont, 'A2', () => appendQueueItem(null, null, Conf.settings.A2.value), AddQueueDescAlt+2);
	appendQueueBtn(qbCont, 'A3', () => appendQueueItem(null, null, Conf.settings.A3.value), AddQueueDescAlt+3);

	let defQty = utils.mkEl('input', msgBox, null, {width:'50px'});
	defQty.type = 'number', defQty.min = 0;
	defQty.title = "Default quantity to assign";
	defQty.value = Conf.settings.defQty.value;
	defQty.onchange = function() {Conf.settings.defQty.value = this.value}
	defQty.onfocus = function() {this.select()}
	Conf.ui.defQty = defQty;

	let assignDefVal = utils.mkEl('button', msgBox, null, null, '⤵');
	assignDefVal.title = "Assign default quantity to all queue items";
	assignDefVal.onclick = () => {
		if(Conf.settings.defQty.value >= 0) {
			document.querySelectorAll('.AWQ-item-qty').forEach((inp) => {
				inp.value = Conf.settings.defQty.value;
				inp.onchange();
			});
			updateQueueState();
		}
	}

	let processBtn = utils.mkEl('button', msgBox, null, null, ProcessTxt);
	processBtn.title = "Start/stop queue processing; You can also use ALT + W";
	processBtn.onclick = () => toggleProcessButton();
	Conf.ui.processBtn = processBtn;

	let clearBtn = utils.mkEl('button', msgBox, null, null, "Clear Queue");
	clearBtn.title = "Erase the queue; You can also use ALT + C";
	clearBtn.onclick = () => {
		Conf.ui.queueCont.textContent = EmptyQueueTxt;
		awqLog('Queue cleared');
		updateQueueState();
	}
	Conf.ui.clearBtn = clearBtn;

	let settingsBtn = utils.mkEl('button', msgBox, null, {float:'right', margin:0}, "Settings");
	settingsBtn.title = "Open script settings menu";
	settingsBtn.onclick = openSettings;

	Conf.ui.queueCont = utils.mkDiv(msgBox, 'AWQ-queue', null, EmptyQueueTxt);

	let clearSettingsBtn = utils.mkEl('button', msgBox, null, {background:'none'}, '❌');
	clearSettingsBtn.title = "Delete current preset";
	clearSettingsBtn.onclick = clearPreset;

	let setList = utils.mkEl('select', msgBox);
	setList.title = "List of saved presets";
	Conf.ui.presetList = setList;

	let editBtn = utils.mkEl('button', msgBox, null, null, '✏️');
	editBtn.title = "Edit current preset";
	editBtn.onclick = editPreset;

	let loadSettingsBtn = utils.mkEl('button', msgBox, null, null, "Load");
	loadSettingsBtn.innerHTML = "Load";
	loadSettingsBtn.title = "Load current preset";
	loadSettingsBtn.onclick = loadPreset;

	let presetName = utils.mkEl('input', msgBox);
	presetName.placeholder = "Preset name";
	presetName.title = "Name for the new preset";
	presetName.onfocus = function() {this.select()}
	Conf.ui.presetName = presetName;

	let saveBtn = utils.mkEl('button', msgBox, null, null, "Save");
	saveBtn.title = "Save a new preset w/ current prompt and settings";
	saveBtn.onclick = addPreset;

	Conf.ui.msgConsole = utils.mkDiv(msgBox, 'AWQ-console');
	awqDebug(`* Running SDAtom-WebUi-us version ${Ver} using ${Handler} with browser ${
		navigator.userAgent} <span style="font-size:.9em">WebUI ${Conf.common.versionContainer.el.textContent}`, true);
	let msgClearBtn = utils.mkEl('button', msgBox, null, null, "Clear");
	msgClearBtn.title = "Clear the console";
	msgClearBtn.onclick = () => {Conf.ui.msgConsole.textContent = ''}

	document.querySelector('.gradio-container').style.overflow = 'visible'; //Fix so that a dropdown menu can overlap the queue
	refreshPresets();

	if(Conf.savedQueue.length > 0) {
		awqDebug(`Loaded saved queue ${Conf.savedQueue.length}`);
		for(let i = 0, q; i < Conf.savedQueue.length; ++i) {
			q = Conf.savedQueue[i], appendQueueItem(q.qty, q.data);
		}
		delete Conf.savedQueue; //Will be regenerated as needed
	}
	awqDebug('generateMainUI: Completed');
}

function appendQueueItem(qty, data, override) {
	awqDebug(`appendQueueItem ${qty}x`);
	if(!Conf.ui.queueCont.firstChild.tagName) Conf.ui.queueCont.textContent = '';
	if(Conf.ui.queueCont.childElementCount >= Conf.settings.maxQueue.value) Conf.ui.queueCont.firstChild.remove();
	let queueItm = utils.mkDiv(Conf.ui.queueCont), setQty = Number(Conf.ui.defQty.value);
	setQty = Number.isFinite(qty) ? qty : setQty > 0 ? setQty : 1;

	let delItm = utils.mkEl('button', queueItm, null, {background:'none'}, '❌');
	delItm.title = "Remove from the queue";
	delItm.onclick = () => {queueItm.remove(); updateQueueState()}

	let moveUp = utils.mkEl('button', queueItm, null, null, '⇧');
	moveUp.title = "Move up in the queue";
	moveUp.onclick = () => {
		let prevItm = queueItm.previousSibling;
		if(prevItm) {
			Conf.ui.queueCont.insertBefore(queueItm, prevItm);
			updateQueueState();
		}
	}

	let moveDown = utils.mkEl('button', queueItm, null, null, '⇩');
	moveDown.title = "Move down in the queue";
	moveDown.onclick = () => {
		let nextItm = queueItm.nextSibling;
		if(nextItm) {
			Conf.ui.queueCont.insertBefore(nextItm, queueItm);
			updateQueueState();
		}
	}

	let moveToBtm = utils.mkEl('button', queueItm, null, null, '⤓');
	moveToBtm.title = "Move to the bottom of the queue";
	moveToBtm.onclick = () => {
		let lastItm = Conf.ui.queueCont.lastChild;
		if(lastItm.lastChild !== queueItm) {
			Conf.ui.queueCont.appendChild(queueItm);
			updateQueueState();
		}
	}

	let moveToTop = utils.mkEl('button', queueItm, null, null, '⤒');
	moveToTop.title = "Move to the top of the queue";
	moveToTop.onclick = () => {
		let firstItm = Conf.ui.queueCont.firstChild;
		if(firstItm && firstItm !== queueItm) {
			Conf.ui.queueCont.insertBefore(queueItm, firstItm);
			updateQueueState();
		}
	}

	let loadItem = utils.mkEl('button', queueItm, null, null, "Load");
	loadItem.title = "Load presets from this item";
	loadItem.onclick = () => loadJSON(itemJSON._json);

	let itemType = utils.mkEl('input', queueItm, 'AWQ-item-type');
	itemType.title = "Type/tab for queue item";
	itemType.disabled = true;

	let itemQty = utils.mkEl('input', queueItm, 'AWQ-item-qty');
	itemQty.type = 'number', itemQty.min = 0;
	itemQty.title = "How many times the task should be executed";
	itemQty.value = setQty;
	function updateItemQtyBG() {
		if(itemQty.value.length == 0) itemQty.style.color = 'red';
		else if(itemQty.value < 1) itemQty.style.color = 'rgb(0, 225, 0)', itemQty.classList.add('completed-queue-item');
		else if(itemQty.value > 0) itemQty.style.color = 'white', itemQty.classList.remove('completed-queue-item');
	}
	itemQty.onchange = () => {updateItemQtyBG(); updateQueueState()}
	itemQty.onfocus = () => itemQty.select();
	updateItemQtyBG();

	let itemJSON = utils.mkEl('input', queueItm, 'AWQ-item-JSON');
	itemJSON.title = "JSON data that defines this queue item's prompt and presets";
	itemJSON._json = data || getValueJSON();
	if(override) {
		awqDebug('appendQueueItem: Adding to queue with override');
		for(let setKey in override) itemJSON._json[setKey] = override[setKey];
	}
	(itemJSON.onchange = e => {
		if(e) itemJSON._json = parseJSON(itemJSON.value);
		if(!itemJSON._json) {
			awqErr('Failed to parse JSON data');
			itemJSON._json = '';
			return;
		}
		itemJSON.value = JSON.stringify(itemJSON._json);
		itemType.value = itemJSON._json.type || '?'; //Update itemType
		if(e) updateQueueState();
	})();

	awqLog(`Added new ${itemType.value} queue item (${setQty}x)`);
	//Wait with updating state while loading a predefined queue
	if(isNaN(qty)) updateQueueState();
}

function saveScriptSettings() {
	awqDebug('Saving script settings');
	let settings = {}, sk, data, val;
	function sErr(e) {e=`Bad value for ${data.name}: ${e}`; alert(e); throw e}
	for(sk in Conf.settings) {
		data = Conf.settings[sk], val = data.value;
		//Validate
		switch(data.type) {
		case 'int':
			val = Number(val);
			if(!Number.isSafeInteger(val)) return sErr("Not an int");
			if(data.min != null && val < data.min) return sErr("Less than "+data.min);
			break;
		case 'range':
			val = Number(val);
			if(!Number.isFinite(val)) return sErr("Not a number");
			break;
		case 'bool':
			if(typeof val !== 'boolean') return sErr("Not a boolean");
			break;
		case 'json':
			if(typeof val !== 'object') {
				if(val) {
					val = parseJSON(val);
					if(!val) return sErr("Invalid JSON");
				} else val = '';
			}
		}
		settings[sk] = data.value = val;
	}
	Conf.ui.defQty.value = Conf.settings.defQty.value; //Update beacuse this one is in two places
	if(!Conf.settings.rememberQueue.value) localStorage.removeItem('awqQueue');
	localStorage.awqSettings = JSON.stringify(settings);
}
function loadScriptSettings() {
	if('awqSettings' in localStorage) try {
		awqDebug('Loding saved script settings');
		let settings = JSON.parse(localStorage.awqSettings);
		for(let sk in Conf.settings) if(sk in settings) Conf.settings[sk].value = settings[sk];
	} catch(e) {awqErr('Failed to load settings, will reset')}
}

function openSettings() {
	document.body.style.overflow = 'hidden';
	let dialog = utils.mkDiv(utils.mkDiv(document.body, 'awq-popup')),
	hdr = utils.mkDiv(dialog, 'awq-hdr'), body = utils.mkDiv(dialog, 'awq-settings')
	utils.mkDiv(hdr, null, null, "<b>SDAtom Settings</b> - <i>Hold your mouse over an item for a description</i>");
	let close = utils.mkDiv(hdr, null, {float:'right', textShadow:'#292929 2px 3px 5px', cursor:'pointer'}, '⛌');
	close.onclick = () => {
		saveScriptSettings();
		document.body.style.overflow = '';
		dialog.parentElement.remove();
	}

	//Create input for each script setting
	for(let key in Conf.settings) {
		let data = Conf.settings[key],
		ssCont = utils.mkDiv(body),
		ssElem = utils.mkEl(data.type=='text'||data.type=='json' ? 'textarea' : 'input');
		ssElem.id = 'awq-ss-' + key;
		ssElem.placeholder = data.name;
		ssElem.onchange = function() {
			Conf.settings[key].value = data.type=='bool' ? this.checked : this.value;
		}

		switch(data.type) {
		case 'bool':
			ssElem.type = 'checkbox';
			ssElem.checked = data.value;
			break;
		case 'int':
			ssElem.type = 'number', ssElem.step = 1;
			if(data.min != null) ssElem.min = data.min;
			ssElem.value = data.value;
			break;
		case 'range':
			ssElem.type = 'range';
			ssElem.min = 0, ssElem.max = 1, ssElem.step = .1;
			ssElem.value = data.value;
			break;
		case 'json':
			if(data.value) ssElem.value = JSON.stringify(data.value);
			break;
		default:
			ssElem.value = data.value;
		}

		let cbLabel = utils.mkEl('label', ssCont, null, null, data.name);
		cbLabel.for = ssElem.id, cbLabel.title = data.description;

		if(data.description.match("http")) {
			let helpLink = utils.mkEl('a', ssCont, null, {textDecoration:'none'}, '❓');
			helpLink.target = '_blank';
			helpLink.href = data.description;
			ssElem.title = data.name;
		} else {
			ssElem.title = data.description;
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
	let allAttrs = {};
	getCurrentQueue().forEach(el => {
		for(let key in el.data) (allAttrs[key]||(allAttrs[key]=[])).push(el.data[key]);
	});

	utils.mkEl('label', replacer, null, null, "Attribute");
	let repAttr = utils.mkEl('input', replacer);
	repAttr.type = 'text';
	repAttr.setAttribute('list', 'awq-rep-attrs');
	repAttr.onfocus = () => repAttr.select();
	let repAttrData = utils.mkEl('datalist', replacer),
	anyOption = utils.mkEl('option', repAttrData);
	repAttrData.id = 'awq-rep-attrs', anyOption.value = AnyValue;
	for(let key in allAttrs) utils.mkEl('option', repAttrData).value = key;

	utils.mkEl('label', replacer, null, null, "Old value");
	let repVal = utils.mkEl('input', replacer);
	repVal.type = 'text';
	repVal.setAttribute('list', 'awq-rep-vals');
	repVal.onfocus = () => repVal.select();
	let repValData = utils.mkEl('datalist', replacer);
	repValData.id = 'awq-rep-vals';

	//Update repValData
	function addRepVals(vals) {
		for(let v of vals) utils.mkEl('option', repValData).value = v;
	}
	(repAttr.onchange = () => {
		let foundVals = allAttrs[repAttr.value];
		repValData.textContent = '';
		repValData.appendChild(anyOption.cloneNode());
		if(foundVals) addRepVals(foundVals); //Add vals for only currently selected
		else for(let k in allAttrs) addRepVals(allAttrs[k]);
	})();

	utils.mkEl('label', replacer, null, null, "New value");
	let repNewVal = utils.mkEl('input', replacer);
	repNewVal.type = 'text';
	repNewVal.setAttribute('list', 'awq-rep-vals');
	repNewVal.onfocus = () => repNewVal.select();

	let repBtn = utils.mkEl('button', replacer, null, null, "Replace");
	repBtn.onclick = () => {
		let attributeValue = repAttr.value,
		anyAttribute = attributeValue == AnyValue,
		oldValue = repVal.value,
		anyOldValue = oldValue == AnyValue,
		queue = Conf.ui.queueCont.getElementsByTagName('div'),
		newValue = repNewVal.value;

		for(let el of queue) {
			el = el.querySelector('.AWQ-item-JSON');
			let data = el._json;
			if(anyAttribute) {
				for(let subKey in data) { //Loop queue entry attributes
					if(anyOldValue) {
						//Replace everything with the new value (why are you doing this?)
						if(newValue != data[subKey]) awqDebug(`replaceButton: updated queue item ${key} attribute ${subKey} to ${newValue}`);
						data[subKey] = newValue;
					} else {
						//Search and replace in all attributes
						let replacedValue = data[subKey].replaceAll ? data[subKey].replaceAll(oldValue, newValue) : data[subKey];
						if(replacedValue != data[subKey]) awqDebug(`replaceButton: updated queue item ${key} attribute ${subKey} to ${replacedValue}`);
						data[subKey] = replacedValue;
					}
				}
			} else if(anyOldValue) {
				//Replace all values for this attribute
				if(newValue != data[attributeValue]) awqDebug(`replaceButton: updated queue item ${key} attribute ${attributeValue} to ${newValue}`);
				data[attributeValue] = newValue;
			} else {
				//Replace string in specific attribute
				let replacedValue = data[attributeValue].replaceAll(oldValue, newValue);
				if(replacedValue != data[attributeValue]) awqDebug(`replaceButton: updated queue item ${key} attribute ${attributeValue} to ${replacedValue}`);
				data[attributeValue] = replacedValue;
			}
			el.onchange();
		}
		updateQueueState();
	}

	//Custom code for opacity button
	let opacityBtn = body.querySelector('#awq-ss-opacity');
	opacityBtn.onchange = () => {document.querySelector('.AWQ-overlay').style.opacity =
		Conf.settings.opacity.value = opacityBtn.value}
}

function toggleProcessButton(state) {
	let oldState = Conf.common.processing;
	if(state == null) state = !oldState;
	else if(state == oldState || Conf.settings.stayReady.value) return;
	awqDebug(`toggleProcessButton ${state}`);
	let pb = Conf.ui.processBtn;
	if(state) {
		awqLog('Processing <b>started</b>');
		Conf.common.processing = true;
		pb.style.background = 'green', pb.innerHTML = '⏸︎ ';
		utils.mkDiv(pb, null, {display:'inline-block'}, '⚙️');
		executeAllNewTasks();
	} else {
		awqLog('Processing <b>ended</b>');
		Conf.common.processing = Conf.common.working = false;
		Conf.common.previousTaskStartTime = pb.style.background = null;
		pb.innerHTML = ProcessTxt;
	}
}

function getCurrentQueue() {
	let queue = Conf.ui.queueCont.getElementsByTagName('div'), data = [];
	for(let q of queue) data.push({
		qty: Number(q.querySelector('.AWQ-item-qty').value),
		data: q.querySelector('.AWQ-item-JSON')._json
	});
	return data;
}

function updateQueueState() {
	if(Conf.settings.rememberQueue.value) {
		awqDebug('updateQueueState: Saving current queue state');
		localStorage.awqQueue = JSON.stringify(getCurrentQueue());
	} else awqDebug('updateQueueState');
}

let stuckProcessingCounter = 0;
function updateStatus() {
	//Get old & new activeType
	let previousType = Conf.common.activeType,
	newType = Conf.common.activeType =
		Conf.common.i2iContainer.el.style.display !== 'none' ? 'i2i' :
		Conf.common.t2iContainer.el.style.display !== 'none' ? 't2i' :
		Conf.common.extContainer.el.style.display !== 'none' ? 'ext' :
		Conf.extensions.iBrowser && Conf.extensions.iBrowser.guiElems
		.iBrowserContainer.el.style.display !== 'none' ? 'iBrowser' : 'other';

	if(newType !== previousType) {
		awqDebug(`updateStatus: active type changed to: ${newType}`);
		Conf.ui.overlay.style.display = Conf.ui.msgBox.style.display = newType === 'other' ? 'none' : '';
	}

	if(Conf.common.processing && !Conf.common.working && !Conf.common.previousTaskStartTime)
		executeAllNewTasks();

	if(Conf.common.waiting || Conf.common.working || !Conf.common.processing)
		stuckProcessingCounter = 0;
	else if(!Conf.settings.stayReady.value && ++stuckProcessingCounter > 30) {
		//If no work is being done for a while disable queue
		awqDebug('updateStatus: stuck in processing queue status? Disabling queue processing');
		toggleProcessButton(false);
		stuckProcessingCounter = 0;
		playWorkDoneSound();
	}
}

async function executeAllNewTasks() {
	while(Conf.common.processing) {
		if(Conf.common.working) return; //Already working on task

		if(Conf.common.previousTaskStartTime) {
			let timeSpent = Date.now() - Conf.common.previousTaskStartTime;
			awqLog(`Completed work on queue item after ${Math.floor(timeSpent / 1000 / 60)} minutes ${
				Math.round((timeSpent - Math.floor(timeSpent / 60000) * 60000) / 1000)} seconds`);
		}

		let queue = Conf.ui.queueCont.getElementsByTagName('div');
		for(let i = 0; i < queue.length; ++i) {
			let itemQty = queue[i].querySelector('.AWQ-item-qty'),
			qty = Number(itemQty.value);
			if(qty > 0) {
				let type = queue[i].querySelector('.AWQ-item-type').value;
				awqDebug(`executeNewTask: next work i=${i} qty=${qty} type=${type}`);
				Conf.common.working = true;
				await loadJSON(queue[i].querySelector('.AWQ-item-JSON')._json);
				await clickStartButton(type);
				itemQty.value -= 1, itemQty.onchange();
				awqLog(`Working on ${type} queue item #${i+1}${qty>1?`(${qty-1} more to go)`:''}`);
				Conf.common.previousTaskStartTime = Date.now();
				await waitForTaskToComplete(type);
				queue = true;
				break;
			}
		}

		//No more tasks to process
		if(queue !== true) {
			if(Conf.common.previousTaskStartTime) {
				Conf.common.previousTaskStartTime = null;
				awqDebug('executeNewTask: No more tasks found');
				playWorkDoneSound();
				toggleProcessButton(false);
			}
			return;
		}
	}
}

function playWorkDoneSound() {if(Conf.settings.notifSound.value) DoneAudio.play()}

function editPreset() {
	let ss = Conf.ui.presetList;
	if(!ss.value.length) return;
	let oldKey = ss.options[ss.selectedIndex].text;
	awqDebug(`editPreset ${oldKey}`);

	document.body.style.overflow = 'hidden';
	let editCont = utils.mkDiv(document.body, 'awq-json-editor'),
	keyInput = utils.mkEl('input', editCont);
	keyInput.title = "Name of the set";

	let dataInput = utils.mkEl('textarea', editCont);
	dataInput.title = "Data in JSON format";

	let btnCont = utils.mkDiv(editCont),
	editBtn = utils.mkEl('button', btnCont, null, null, "OK");
	editBtn.title = "Save changes";
	editBtn.onclick = () => {
		//Validate
		let key = keyInput.value, data = dataInput.value;
		if(keyInput.value.length < 1) return alert('Name is required');
		data = parseJSON(data, true);
		if(!data) return alert('Oops, invalid JSON');

		//Remove overlay
		document.body.style.overflow = '';
		editCont.remove();

		//Update data and refresh UI
		awqDebug(`editPreset: updating ${oldKey} ${key===oldKey?'':' to '+key}`);
		delete Conf.presets[oldKey];
		Conf.presets[key] = data;
		savePresets();

		//Select option again
		let opt = Array.from(ss.options).find(el => el.text===key);
		opt.selected = true;
	}

	let rstBtn = utils.mkEl('button', btnCont, null, null, "Reset");
	rstBtn.title = "Revert changes";
	(rstBtn.onclick = () => {
		keyInput.value = oldKey;
		dataInput.value = JSON.stringify(Conf.presets[oldKey]);
	})();
}

function addPreset() {
	if(Conf.ui.presetName.value.length < 1) return alert('Missing name');
	if(Conf.ui.presetName.value in Conf.presets) return alert('Duplicate name');
	let key = Conf.common.activeType + '-' + Conf.ui.presetName.value;
	Conf.presets[key] = getValueJSON();
	awqLog(`Saved new preset ${key}`);
	savePresets();
}
function refreshPresets() {
	let len = Object.keys(Conf.presets).length;
	awqDebug(`refreshPresets ${len}`);
	Conf.ui.presetName.value = Conf.ui.presetList.textContent = '';
	if(len < 1) utils.mkEl('option', Conf.ui.presetList, null, null, "Stored settings").value = '';
	else for(let prop in Conf.presets) utils.mkEl('option', Conf.ui.presetList, null, null, prop).value = '1';
}
async function loadPreset() {
	let ss = Conf.ui.presetList;
	if(!ss.value.length) return;
	let key = ss.options[ss.selectedIndex].text;
	awqDebug(`loadPreset ${key}`);
	await loadJSON(Conf.presets[key]);
}
function clearPreset() {
	let ss = Conf.ui.presetList;
	if(!ss.value.length) return;
	let opt = ss.options[ss.selectedIndex], key = opt.text;
	awqLog(`Removed preset ${key}`);
	delete Conf.presets[key];
	opt.remove();
	savePresets(ss.value.length);
}
function savePresets(noRefresh) {
	localStorage.awqPresets = JSON.stringify(Conf.presets);
	if(!noRefresh) refreshPresets();
}

function clickStartButton(type) {
	awqDebug(`clickStartButton ${type}`);
	if(Conf.common.waiting || !Conf.common.processing) return;
	let btn = Conf[Conf.common.activeType].controls.genrateButton.el,
	maxTry = WaitForStart / TickDelay;
	btn.click();
	Conf.common.waiting = true;
	return new Promise((res, rej) => {
		let retryCount = 0, tmr = setInterval(() => {
			if(!Conf.common.processing) {
				clearInterval(tmr), rej("Work cancelled");
			}
			if(++retryCount >= maxTry) {
				btn.click(), retryCount = 0;
				awqDebug(`Work has not started after ${WaitForStart/1000} seconds, clicked again`);
			}
			if(!webUICurrentyWorkingOn(type)) return;
			Conf.common.waiting = false;
			awqDebug('clickStartButton: work has started');
			clearInterval(tmr), res();
		}, TickDelay);
	});
}

function switchTabAndWait(type) {
	if(type == Conf.common.activeType) return;
	awqDebug(`switchTabAndWait ${type}`);
	Conf.shadowDOM.root.querySelector(Conf[type].controls.tabButton.sel).click(); //Using .el doesn't work
	Conf.common.waiting = true;
	return new Promise(resolve => {
		let startingTab = Conf.common.activeType;
		let waitForSwitchInterval = setInterval(() => {
			if(Conf.common.activeType !== type) return;
			Conf.common.waiting = false;
			awqLog(`Switched active tab from ${startingTab} to ${Conf.common.activeType}`);
			clearInterval(waitForSwitchInterval);
			resolve();
		}, TickDelay);
	});
}

function switchTabAndWaitUntilSwitched(targetTabName, tabConfig) {
	awqDebug(`switchTabAndWaitUntilSwitched: target=${targetTabName} config=${tabConfig}`);
	let targetTabConf = tabConfig.filter((elem) => {return elem.name == targetTabName})[0];
	function correctTabVisible() {
		return Conf.shadowDOM.root.querySelector(targetTabConf.containerSel).style.display != 'none';
	}
	if(correctTabVisible()) return;
	Conf.shadowDOM.root.querySelector(targetTabConf.buttonSel).click();
	Conf.common.waiting = true;
	return new Promise(resolve => {
		let waitForSwitchInterval = setInterval(() => {
			if(!correctTabVisible()) return;
			Conf.common.waiting = false;
			awqDebug('switchTabAndWaitUntilSwitched: switch complete');
			clearInterval(waitForSwitchInterval);
			resolve();
		}, TickDelay);
	});
}

function forceGradioUIUpdate() {
	const someCheckboxInputSelector = '#txt2img_subseed_show input';
	document.querySelector(someCheckboxInputSelector).click();
	document.querySelector(someCheckboxInputSelector).click();
}

function webUICurrentyWorkingOn(type) {
	if(type == 'i2i' || type == 't2i')
		return Conf[type].controls.skipButton.el.getAttribute('style') == 'display: block;';
	return Conf.ext.controls.loadingElement.el.innerHTML.length > 0;
}

function waitForTaskToComplete(type) {
	awqDebug(`waitForTaskToComplete: Waiting to complete work for ${type}`);
	Conf.common.waiting = true;
	return new Promise(resolve => {
		let waitForCompleteInterval = setInterval(() => {
			if(webUICurrentyWorkingOn(type)) return;
			clearInterval(waitForCompleteInterval);
			awqDebug(`Work complete for ${type}`);
			Conf.common.waiting = Conf.common.working = false;
			resolve();
		}, TickDelay);
	});
}

function filterPrompt(promptText, neg) {
	let filter = Conf.settings.filter.value || [];
	for(let f of filter) {
		if(!('pattern' in f && 'flags' in f && 'replace' in f)) continue;
		let regEx = new RegExp(f.pattern, f.flags),
		tmpPrompt = promptText.replace(regEx, f.replace);
		if(tmpPrompt !== promptText) {
			let changesCount = levenshteinDist(promptText, tmpPrompt);
			awqLog(`Filtered ${neg ? '(neg)' : ''}prompt with filter (${f.desc}), ${changesCount} char changes`);
			awqDebug(`Filtered from:<pre>${promptText}</pre>to:<pre>${tmpPrompt}</pre>`);
			promptText = tmpPrompt;
		}
	}
	return promptText;
}

function exportImport(input) {
	let json = input.value.trim();
	if(json) { //Import
		json = parseJSON(json);
		if(!json) return alert('Oops, invalid JSON');
		localStorage.awqPresets = JSON.stringify(json.presets);
		localStorage.awqQueue = JSON.stringify(json.queue);
		localStorage.awqSettings = JSON.stringify(json.settings);
		location.reload();
	} else { //Export
		input.value = JSON.stringify({
			presets: Conf.presets, queue: getCurrentQueue(),
			settings: JSON.parse(localStorage.awqSettings)
		});
		awqLog('Exported script data');
		input.focus(), input.select();
	}
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
		}
		return s1_len + s2_len;
	}
}

function getValueJSON(type) {
	if(!type) type = Conf.common.activeType;
	awqDebug(`getValueJSON ${type}`);
	let json = {type: type};

	if(type == 'ext') { //Needs special saving since it's not an input but a tab switch
		json.extrasMode = Conf.ext.controls.extrasMode.filter((elem) => {
			return Conf.shadowDOM.root.querySelector(elem.containerSel).style.display != 'none'
		})[0].name;
		json.extrasResizeMode = Conf.ext.controls.extrasResizeMode.filter((elem) => {
			return Conf.shadowDOM.root.querySelector(elem.containerSel).style.display != 'none'
		})[0].name;
	} else if(type == 'i2i') { //Needs special saving since it's not an input but a tab switch
		json.i2iMode = Conf.i2i.controls.i2iMode.filter((elem) => {
			return Conf.shadowDOM.root.querySelector(elem.containerSel).style.display != 'none'
		})[0].name;
	} else if(type == 'iBrowser') {
		return Conf.extensions.iBrowser.functions.getValueJSON();
	}

	for(let prop in Conf[type]) {
		if(prop !== 'controls') {
			try {
				if(Conf[type][prop].gradEl) {
					json[prop] = getGradVal(Conf[type][prop].gradEl);
				} else if(Conf[type][prop].el.classList.contains('input-accordion')) { //"input-accordion" (checkbox alternative)
					json[prop] = Conf[type][prop].el.classList.contains('input-accordion-open');
				} else if(Conf[type][prop].el.type == 'fieldset') { //Radio buttons
					json[prop] = Conf[type][prop].el.querySelector('input:checked').value;
				} else if(Conf[type][prop].el.type == 'checkbox') {
					json[prop] = Conf[type][prop].el.checked;
				} else { //Inputs, Textarea
					json[prop] = Conf[type][prop].el.value;
					if(prop == 'prompt') json[prop] = filterPrompt(json[prop]);
					if(prop == 'negPrompt' && Conf.settings.filterNeg.value) json[prop] = filterPrompt(json[prop], true);
				}
			} catch(e) {
				awqErr(`Failed to retrieve settings for ${type} item ${prop} with error ${e.message}:<pre>${e.stack}</pre>`);
			}
		}
	}
	json.sdModelCheckpoint = getGradVal(Conf.common.sdModelCheckpoint.gradEl);
	return json;
}
async function loadJSON(data) {
	if(typeof data !== 'object' || !Conf[data.type]) {
		let e = "Invalid JSON data:\n"+data;
		awqErr(e); throw e;
	}
	let verbose = Conf.settings.verbose.value,
	oldData = verbose ? getValueJSON(data.type) : 0;
	awqDebug(`loadJson ${data.type}`);

	let currentModel = getGradVal(Conf.common.sdModelCheckpoint.gradEl);
	if(currentModel == data.sdModelCheckpoint) {
		awqDebug(`loadJson: Correct model already loaded: ${currentModel}`);//No action needed
	} else if(Conf.common.sdModelCheckpoint.gradEl.props.choices.includes(data.sdModelCheckpoint)) { //Check if model exists
		awqDebug(`loadJson: Trying to load model: ${data.sdModelCheckpoint}`);
		setGradVal(Conf.common.sdModelCheckpoint.gradEl, data.sdModelCheckpoint);
		setCheckpointWithPost(data.sdModelCheckpoint); //Only setting gradio config no longer works?
	} else {
		let e = `Model ${data.sdModelCheckpoint} was not found, using current model ${currentModel}`;
		awqErr(e); throw e;
	}

	if(Conf.common.activeType !== data.type) await switchTabAndWait(data.type); //Switch tab?

	//Needs special loading since it's not an input but a tab switch
	if(data.extrasResizeMode) await switchTabAndWaitUntilSwitched(data.extrasResizeMode, Conf.ext.controls.extrasResizeMode);
	if(data.extrasMode) await switchTabAndWaitUntilSwitched(data.extrasMode, Conf.ext.controls.extrasMode);
	if(data.i2iMode) await switchTabAndWaitUntilSwitched(data.i2iMode, Conf.i2i.controls.i2iMode);

	let loadOutput = 'loadJson: loaded: ';
	for(let prop in data) {
		let triggerOnBaseElem = true;
		if(['type', 'extrasMode', 'extrasResizeMode', 'sdModelCheckpoint', 'i2iMode'].includes(prop)) continue;
		try {
			if(verbose && oldData[prop] != data[prop]) loadOutput += `${prop}:${oldData[prop]}-->${data[prop]} | `;
			if(Conf[data.type][prop].el) {
				if(Conf[data.type][prop].el.type == 'fieldset') {
					triggerOnBaseElem = false; //No need to trigger this on base element
					Conf[data.type][prop].el.querySelector(`[value="${data[prop]}"]`).checked = true;
					triggerChange(Conf[data.type][prop].el.querySelector(`[value="${data[prop]}"]`));
				} else if(Conf[data.type][prop].el.classList.contains('input-accordion')) { //"input-accordion" (checkbox alternative)
					let currentValue = Conf[data.type][prop].el.classList.contains('input-accordion-open');
					if(data[prop] != currentValue) Conf[data.type][prop].el.querySelector('.label-wrap').click();
				} else if(Conf[data.type][prop].el.type == 'select-one') { //Select
					if(Conf[data.type][prop].el.checked == data[prop]) triggerOnBaseElem = false; //Not needed
					Conf[data.type][prop].el.value = data[prop];
				} else if(Conf[data.type][prop].el.type == 'checkbox') {
					if(Conf[data.type][prop].el.checked == data[prop]) triggerOnBaseElem = false; //Prevent checbox getting toggled
					Conf[data.type][prop].el.checked = data[prop];
				} else { //Input, Textarea
					if(Conf[data.type][prop].el.value == data[prop]) triggerOnBaseElem = false; //Fixes svelte error
					Conf[data.type][prop].el.value = data[prop];
				}
				if(Conf[data.type][prop].el2) {
					let triggerForSel2 = Conf[data.type][prop].sel2.value != data[prop];
					Conf[data.type][prop].el2.value = data[prop];
					if(triggerForSel2) triggerChange(Conf[data.type][prop].el2);
				}
			}
			if(Conf[data.type][prop].gradEl) {
				setGradVal(Conf[data.type][prop].gradEl, data[prop]);
				triggerOnBaseElem = false;
			}
			if(triggerOnBaseElem) triggerChange(Conf[data.type][prop].el);
		} catch(e) {
			awqErr(`Failed to load settings for ${data.type} item ${prop} with error ${e.message}:<pre>${e.stack}</pre>`);
		}
	}
	if(verbose) awqDebug(loadOutput.replace(/\|\s$/, ''));
	forceGradioUIUpdate();
}

function waitForElm(selector) {
	return new Promise(resolve => {
		if(document.querySelector(selector))
			return resolve(document.querySelector(selector));

		const observer = new MutationObserver(() => {
			if(document.querySelector(selector)) {
				resolve(document.querySelector(selector));
				observer.disconnect();
			}
		});

		observer.observe(document.body, {childList: true, subtree: true});
	});
}
function setCheckpointWithPost(target_cp) {
	awqDebug(`setCheckpointWithPost ${target_cp}`);
	target_cp = target_cp.replace('/', '//').replace('\\', '\\\\');

	//Try to find fn_index for the switch checkpoint "function"
	let checkPointGradioElemId = Conf.common.sdModelCheckpoint.gradEl.id;
	let fnIndex = gradio_config.dependencies.filter(comp => comp.inputs[0] == checkPointGradioElemId);
	fnIndex = fnIndex ? gradio_config.dependencies.indexOf(fnIndex[0]) : null;
	if(fnIndex) awqDebug(`setCheckpointWithPost: found fn_index ${fnIndex}`);
	else return awqErr('setCheckpointWithPost: failed to find fn_index for model change');

	fetch("/run/predict", {
		method: "POST", headers: {"Content-Type": "application/json"}, redirect: "follow",
		body: `{"fn_index":${fnIndex},"data":["${target_cp}"],"event_data":null,"session_hash":"trlwn215an"}`
	}).then(response => {
		awqDebug(`setCheckpointWithPost: repsonse: ${response.status}-${response.statusText}: ${JSON.stringify(response.json())}`);
	}).catch(error => {
		awqDebug(`setCheckpointWithPost: error: ${JSON.stringify(error)}`);
	});
}

function triggerChange(elem) {
	let evt = document.createEvent('HTMLEvents');
	evt.initEvent('change', false, true); //Needed for script to update subsection
	elem.dispatchEvent(evt);
	evt = document.createEvent('HTMLEvents');
	evt.initEvent('input', false, true); //Needded for webui to register changed settings
	elem.dispatchEvent(evt);
}

function findGradioComponentState(eid) {
	return gradio_config.components.filter(comp => comp.props.elem_id == eid);
}
function findGradioComponentStateByLabel(label) {
	return gradio_config.components.filter(comp => comp.props.label == label);
}
function getGradVal(grad) { return grad.props.value; }
function setGradVal(grad, val) { grad.props.value = val; }

function parseJSON(str, reqType) {
	try {
		str = JSON.parse(str);
		if(typeof str !== 'object' || Array.isArray(str)) throw 'a';
		if(reqType && !Conf[str.type]) throw 't';
		return str;
	} catch(e) {}
}

})();