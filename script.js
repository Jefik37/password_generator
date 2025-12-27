const groups = {
    "upper_letters": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "lower_letters": "abcdefghijklmnopqrstuvwxyz",
    "numbers": "0123456789",
    "logograms": "#%&^`~$@",
    "extended_ascii": "¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ",
    "ponctuation": ".,;:",
    "quotes": "\"'",
    "slashes": "/\\|_-",
    "math_symbols": "+*=<>!?",
    "parentheses": "()[]{}",
};

let hide_clipboard, clipboardtimeout;

const similar_chars = new Set("0O1lI|vVuU");

const colors = {
    'very_weak': 'rgb(239, 68, 68)',
    'weak': 'rgb(251, 146, 60)',
    'fair': 'rgb(234, 179, 8)',
    'strong': 'rgb(132, 204, 22)',
    'very_strong': 'rgb(34, 197, 94)'
};

const id_params = {
    password_input: document.getElementById("password_input"),
    eye_checkbox: document.getElementById("eye_checkbox"),
    entropy_slider_bg: document.getElementById("entropy_slider_bg"),
    entropy_slider: document.getElementById("entropy_slider"),
    password_quality: document.getElementById("password_quality"),
    entropy_value: document.getElementById("entropy_value"),
    password_quality_bar: document.getElementById("password_quality_bar"),
    password_char_length: document.getElementById("password_char_length"),
    refresh_button: document.getElementById("refresh_button"),
    clipboard_button: document.getElementById("clipboard_button"),
    clipboard_warning: document.getElementById("clipboard_warning"),
    password_length_slider: document.getElementById("password_length_slider"),
    password_length: document.getElementById("password_length"),
    button_up: document.getElementById("button_up"),
    button_down: document.getElementById("button_down"),
    upper_letters: document.getElementById("upper_letters"),
    lower_letters: document.getElementById("lower_letters"),
    numbers: document.getElementById("numbers"),
    logograms: document.getElementById("logograms"),
    extended_ascii: document.getElementById("extended_ascii"),
    ponctuation: document.getElementById("ponctuation"),
    quotes: document.getElementById("quotes"),
    slashes: document.getElementById("slashes"),
    math_symbols: document.getElementById("math_symbols"),
    parentheses: document.getElementById("parentheses"),
    cjk: document.getElementById("cjk"),
    extra_chars: document.getElementById("extra_chars"),
    excluded_chars: document.getElementById("excluded_chars"),
    exclude_similar: document.getElementById("exclude_similar"),
    use_all_groups: document.getElementById("use_all_groups"),
    eye: document.getElementById("eye") 
};

function randomFloat(){
    const buf = new Uint32Array(2);
    crypto.getRandomValues(buf);
    const hi = buf[0] & 0x001fffff;
    const lo = buf[1];
    return (hi * 2 ** 32 + lo) / 2 ** 53;
}

function generate_cjk_char(){
    let cjk_char = Math.floor(randomFloat()*20992 + 19968);
    return String.fromCodePoint(cjk_char);
}

function update_password_quality(){
    const password = id_params.password_input.value;
    const entropy = calculate_entropy(password);
    let password_quality = get_password_quality(entropy);
    let entropy_slider_length = entropy < 200 ? entropy / 2 : 200;

    id_params.entropy_slider.style.backgroundColor = colors[password_quality];
    id_params.entropy_slider.style.width = entropy_slider_length + "%";

    id_params.entropy_value.textContent = entropy.toFixed(2) + ' bit';
    id_params.password_quality.className = password_quality;

    let quality_text = password_quality.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    id_params.password_quality.textContent = quality_text;
}

function update_char_count(){
    const password_len = id_params.password_input.value.length;
    id_params.password_char_length.textContent = password_len;
    update_password_quality();
}

function get_password_quality(entropy) {
    if (entropy < 28) return "very_weak";
    if (entropy < 35) return "weak";
    if (entropy < 60) return "fair";
    if (entropy < 128) return "strong";
    return "very_strong";
}

function calculate_entropy(password) {
    const freq = {};
    for(let char of password) {
        freq[char] = (freq[char] || 0) + 1;
    }
    let entropy = 0;
    const len = password.length;
    for(let char in freq) {
        const p = freq[char] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy * len;
}

function subtract_set(set_a, set_b){
    let result = new Set(set_a);
    let b = new Set(set_b);
    return [...result].filter(x => !b.has(x));
}

function shuffleArray(array){
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(randomFloat() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function random_array_item(array){
    return array[Math.floor(randomFloat() * array.length)];
}

function generate_char(password, cur_group, excluded_chars){
    cur_group = subtract_set(cur_group, excluded_chars);
    cur_group = random_array_item(cur_group);
    if(cur_group === 'cjk'){
        cur_group = generate_cjk_char();
        while(excluded_chars.has(cur_group)){ cur_group = generate_cjk_char(); }
    }
    password.push(cur_group);
    return password;
}

function generate_password(password_length){
    let cur_group;
    let password = [];
    const sets = [];
    const excluded_chars = new Set(id_params.excluded_chars.value);
    let extra_chars = subtract_set(id_params.extra_chars.value, excluded_chars);

    for(let group in groups){
        if(id_params[group].checked){ sets.push(groups[group]); }
    }

    if(extra_chars.length > 0){ sets.push(extra_chars.join('')); }
    if(id_params.cjk.checked){ sets.push(['cjk']); }

    if(id_params.use_all_groups.checked){
        const temp_sets = [...sets];
        while(temp_sets.length > 0){
            cur_group = temp_sets.pop();
            password = generate_char(password, cur_group, excluded_chars);
        }
    }

    while(password.length < password_length){
        cur_group = random_array_item(sets);
        password = generate_char(password, cur_group, excluded_chars);
    }

    password = shuffleArray(password);
    return password.join('');
}

function main(){
    const p_length = id_params.password_length.value;
    if(!id_params.refresh_button.disabled){
        id_params.password_char_length.textContent = p_length;
        id_params.password_input.value = generate_password(p_length);
        validate_checkboxes();
        update_char_count();
        update_password_quality();
    }
}

function validate_checkboxes(){
    let quant_checked = 0;
    const p_length = id_params.password_length.value;
    id_params.refresh_button.disabled = true;
    
    if(id_params.extra_chars.value){
        id_params.refresh_button.disabled = false;
        quant_checked++;
    }

    if(id_params.cjk.checked){
        id_params.refresh_button.disabled = false;
        quant_checked++;
    }

    for(let group in groups){
        if(id_params[group].checked){
            id_params.refresh_button.disabled = false;
            quant_checked++;
            let current_group_set = new Set(groups[group]);
            const excluded = id_params.excluded_chars.value;
            let filtered = subtract_set(current_group_set, excluded);
            if(filtered.length === 0){ id_params.refresh_button.disabled = true; }
        }
    }

    if(quant_checked > p_length){ id_params.refresh_button.disabled = true; }
    id_params.refresh_button.classList.toggle('inactive_refresh', id_params.refresh_button.disabled);
}

function copy_to_clipboard(){
    const text = id_params.password_input.value;
    const div_clip = id_params.clipboard_warning;
    clearTimeout(clipboardtimeout);
    clearTimeout(hide_clipboard);
    navigator.clipboard.writeText(text).then(() => {
        div_clip.style.visibility = 'visible';
        div_clip.style.transition = 'opacity 0s';
        div_clip.style.opacity = '1';
        clipboardtimeout = setTimeout(function(div){
            div.style.transition = 'opacity 0.3s';
            div.style.opacity = '0';
        }, 1000, div_clip);
        hide_clipboard = setTimeout((div) => div.style.visibility = "hidden", 1300, div_clip);
    }).catch(err => {
        console.error("Error copying to clipboard: ", err);
    });
}

function up_button(){
    id_params.password_length.value++;   
    id_params.password_length_slider.value = id_params.password_length.value;
}

function down_button(){
    if(id_params.password_length.value > 1){
        id_params.password_length.value--;   
        id_params.password_length_slider.value = id_params.password_length.value;
    }
}

function check_eye(){
    id_params.password_input.type = id_params.eye_checkbox.checked ? "text" : "password";
}

// Event Listeners usando id_params
document.addEventListener('click', validate_checkboxes);
document.addEventListener('input', validate_checkboxes);
document.addEventListener('change', validate_checkboxes);

id_params.extra_chars.addEventListener('input', main);
id_params.excluded_chars.addEventListener('input', main);
id_params.exclude_similar.addEventListener('change', main);
id_params.use_all_groups.addEventListener('change', main);
id_params.button_up.addEventListener('click', main);
id_params.button_down.addEventListener('click', main);
id_params.cjk.addEventListener('change', main);

for(let group in groups){
    id_params[group].addEventListener('change', main);
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        id_params.refresh_button.click();
    }
});

// Nota: Certifique-se que o elemento com id 'eye' existe no seu HTML como usado abaixo
if(id_params.eye) id_params.eye.addEventListener('change', check_eye);

id_params.password_length_slider.addEventListener('input', function() {
    id_params.password_length.value = this.value;
    main();
});

id_params.password_length.addEventListener('input', function() {
    id_params.password_length_slider.value = this.value;
    main();
});

main();
check_eye();
validate_checkboxes();
if(id_params.refresh_button.disabled) {
    id_params.password_input.value = '';
} else {
    main();
}
id_params.password_input.addEventListener('input', update_char_count);

document.addEventListener('contextmenu', e => e.preventDefault());
