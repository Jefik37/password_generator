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

function generate_cjk_char(){
    let cjk_char = Math.floor(Math.random()*20992 + 19968);
    return String.fromCodePoint(cjk_char);
}


function update_password_quality(){
    
    const password = document.getElementById("password_input").value;
    const entropy = calculate_entropy(password);
    let password_quality = get_password_quality(entropy);
    let entropy_slider_length = entropy<200? entropy/2 : 200;

    document.getElementById('entropy_slider').style.backgroundColor = colors[password_quality];
    document.getElementById('entropy_slider').style.width = entropy_slider_length+"%";

    document.getElementById('entropy_value').textContent = entropy.toFixed(2)+' bit';
    document.getElementById('password_quality').className = password_quality;

    password_quality = password_quality.split('_');
    password_quality = password_quality.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    document.getElementById('password_quality').textContent = password_quality;
}

function update_char_count(){

    const password_length = document.getElementById("password_input").value.length;
    document.getElementById("password_char_length").textContent = password_length;
    update_password_quality();

}

function get_password_quality(entropy) {
    if (entropy < 40) return "very_weak";
    if (entropy < 60) return "weak";
    if (entropy < 80) return "fair";
    if (entropy < 100) return "strong";
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
    set_b = new Set(set_b);
    result = [...result].filter(x => !set_b.has(x));
    return [...result];
}

function shuffleArray(array){
    
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function random_array_item(array){
    return array[Math.floor(Math.random() * array.length)];
}

function generate_char(password, cur_group, excluded_chars){

    cur_group = subtract_set(cur_group, excluded_chars);
    cur_group = random_array_item(cur_group);
    if(cur_group==='cjk'){
        cur_group = generate_cjk_char();
        while(excluded_chars.has(cur_group)){cur_group = generate_cjk_char();}
    }

    password.push(cur_group);
    return password;
}

function generate_password(password_length){

    let temp_set;
    let cur_group;
    let password = [];
    const sets = [];
    const cjk = document.getElementById('cjk');
    const excluded_chars = new Set(document.getElementById('excluded_chars').value);
    let extra_chars = subtract_set(document.getElementById('extra_chars').value, excluded_chars);

    for(let group in groups){
        if(document.getElementById(group).checked){sets.push(groups[group]);}
    }

    if(extra_chars.length>0){sets.push(extra_chars.join(''));}
    if(cjk.checked){sets.push(['cjk']);}

    if(document.getElementById('use_all_groups').checked){
        temp_sets = [...sets];
        while(temp_sets.length>0){

            cur_group = temp_sets.pop();
            password = generate_char(password, cur_group, excluded_chars);
        }
    }

    while(password.length<password_length){
        cur_group = random_array_item(sets);
        password = generate_char(password, cur_group, excluded_chars);
    }

    password = shuffleArray(password);

    return password.join('');

}

function main(){
    
    const password_length = document.getElementById("password_length").value;

    if(!document.getElementById("refresh_button").disabled){
        document.getElementById("password_char_length").textContent = password_length;
        document.getElementById('password_input').value = generate_password(password_length);
        validate_checkboxes();
        update_char_count();
        update_password_quality();
    }
}

function validate_checkboxes(){

    let quant_checked = 0;
    let refresh_button = document.getElementById("refresh_button");
    const password_length = document.getElementById("password_length").value;
    refresh_button.disabled = true;
    
    if(document.getElementById("extra_chars").value){
        refresh_button.disabled = false;
        quant_checked++;
    }

    if(document.getElementById("cjk").checked){
        refresh_button.disabled = false;
        quant_checked++;
    }

    for(let group in groups){
        if(document.getElementById(group).checked){
            refresh_button.disabled = false;
            quant_checked++;
            group = new Set(groups[group]);
            const excluded_chars = document.getElementById('excluded_chars').value;
            group = subtract_set(group, excluded_chars);
            if(group.length === 0){refresh_button.disabled = true;}
        }
    }

    if(quant_checked > password_length){refresh_button.disabled = true;}

    refresh_button.classList.toggle('inactive_refresh', refresh_button.disabled);
}


function copy_to_clipboard(){
    const text = document.getElementById('password_input').value;
    const div_clip = document.getElementById('clipboard_warning');
    clearTimeout(clipboardtimeout);
    clearTimeout(hide_clipboard);
    navigator.clipboard.writeText(text).then(() => {
        div_clip.style.visibility = 'visible';
        div_clip.style.transition = 'opacity 0s';
        div_clip.style.opacity = '1';
        clipboardtimeout = setTimeout(
            function(div_clip){
                div_clip.style.transition = 'opacity 0.3s';
                div_clip.style.opacity = '0';
            }, 1000, div_clip
        )
        hide_clipboard = setTimeout((div_clip) => div_clip.style.visibility = "hidden",
                                    1300, div_clip
        );
    }).catch(err => {
        console.error("Error copying to clipboard: ", err);
    });
}

function up_button(){
    document.getElementById('password_length').value++;   
    document.getElementById('password_length_slider').value = document.getElementById('password_length').value
}

function down_button(){
    if(document.getElementById('password_length').value>1){
        document.getElementById('password_length').value--;   
        document.getElementById('password_length_slider').value = document.getElementById('password_length').value
    }
}

function check_eye(){
    let pass_type = document.getElementById('password_input');
    pass_type.type = document.getElementById('eye_checkbox').checked ? "text" : "password";
}

document.addEventListener('click', validate_checkboxes);
document.addEventListener('input', validate_checkboxes);
document.addEventListener('change', validate_checkboxes);

document.getElementById('extra_chars').addEventListener('input', main);
document.getElementById('excluded_chars').addEventListener('input', main);

document.getElementById('exclude_similar').addEventListener('change', main);
document.getElementById('use_all_groups').addEventListener('change', main);

document.getElementById('button_up').addEventListener('click', main);
document.getElementById('button_down').addEventListener('click', main);

document.getElementById('cjk').addEventListener('change', main);

for(let group in groups){
    document.getElementById(group).addEventListener('change', main);
}



document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('refresh_button').click();
    }
});

document.getElementById('eye').addEventListener('change', check_eye);

const password_length_slider = document.getElementById('password_length_slider');
const numberInput = document.getElementById('password_length');

password_length_slider.addEventListener('input', function() {
    numberInput.value = this.value;
    main();
});

numberInput.addEventListener('input', function() {
    password_length_slider.value = this.value;
    main();
});

main();
check_eye();
validate_checkboxes();
document.getElementById("refresh_button").disabled ? document.getElementById("password_input").value = '' : main();
document.getElementById('password_input').addEventListener('input', update_char_count);


document.addEventListener('contextmenu', e => e.preventDefault());
