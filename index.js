const MODULE_NAME = 'koboldModelSwitcher';
const API_PATH = '/v1/models';

// --- Settings ---

function getDefaultSettings() {
    return Object.freeze({
        koboldUrl: 'http://192.168.0.23:5001',
        currentModel: '',
        lastUpdate: 0
    });
}

function getSettings() {
    const ctx = SillyTavern.getContext();
    if (!ctx.extensionSettings[MODULE_NAME]) {
        ctx.extensionSettings[MODULE_NAME] = structuredClone(getDefaultSettings());
    }
    for (const key of Object.keys(getDefaultSettings())) {
        if (!Object.hasOwn(ctx.extensionSettings[MODULE_NAME], key)) {
            ctx.extensionSettings[MODULE_NAME][key] = getDefaultSettings()[key];
        }
    }
    return ctx.extensionSettings[MODULE_NAME];
}

// --- KoboldCpp API ---

async function fetchModels() {
    const settings = getSettings();
    const ctx = SillyTavern.getContext();
    const url = settings.koboldUrl.replace(/\/+$/, '') + API_PATH;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        // Handle both OpenAI format ({data: [{id, ...}]}) and legacy format
        const models = data.data ? data.data.map(m => m.id) : (Array.isArray(data) ? data : []);
        return models;
    } catch (err) {
        console.error('[KoboldModelSwitcher] Failed to fetch models:', err.message);
        return [];
    }
}

async function switchModel(modelName) {
    const settings = getSettings();
    const ctx = SillyTavern.getContext();
    const url = settings.koboldUrl.replace(/\/+$/, '') + '/v1/chat/completions';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: 'ok' }],
                max_tokens: 1,
                temperature: 0
            })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        settings.currentModel = modelName;
        settings.lastUpdate = Date.now();
        ctx.saveSettingsDebounced();
        return true;
    } catch (err) {
        console.error('[KoboldModelSwitcher] Failed to switch model:', err.message);
        return false;
    }
}

// --- UI ---

async function renderModelSelector(models) {
    const container = document.getElementById('kms_model_list');
    if (!container) return;

    const settings = getSettings();

    // Clear and rebuild
    container.innerHTML = '';

    if (models.length === 0) {
        container.innerHTML = '<p class="kms-empty">Keine Modelle gefunden. Prüfe KoboldCpp-URL und Router-Mode.</p>';
        return;
    }

    // Create select
    const select = document.createElement('select');
    select.id = 'kms_model_select';
    select.className = 'text_pole';
    select.style.width = '100%';
    select.style.marginBottom = '8px';

    for (const model of models) {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        if (model === settings.currentModel) {
            option.selected = true;
        }
        select.appendChild(option);
    }
    container.appendChild(select);

    // Create switch button
    const btn = document.createElement('button');
    btn.id = 'kms_switch_btn';
    btn.className = 'menu_button interactable';
    btn.style.width = '100%';
    btn.style.padding = '6px 12px';
    btn.textContent = 'Modell wechseln';
    container.appendChild(btn);

    // Status message
    const status = document.createElement('p');
    status.id = 'kms_status';
    status.className = 'kms-status';
    status.style.fontSize = '12px';
    status.style.marginTop = '6px';
    if (settings.currentModel) {
        status.textContent = `Aktuell: ${settings.currentModel}`;
    }
    container.appendChild(status);

    // Button click handler
    btn.addEventListener('click', async () => {
        const selectedModel = select.value;
        if (!selectedModel) return;

        btn.disabled = true;
        btn.textContent = 'Lade...';
        status.textContent = 'Wechsle Modell...';

        const success = await switchModel(selectedModel);

        btn.disabled = false;
        btn.textContent = 'Modell wechseln';

        if (success) {
            status.textContent = `✅ ${selectedModel}`;
            // Re-render to update selection
            renderModelSelector(models);
        } else {
            status.textContent = '❌ Fehler beim Wechseln';
        }
    });
}

async function refreshModels() {
    const models = await fetchModels();
    await renderModelSelector(models);
}

async function initSettings() {
    const ctx = SillyTavern.getContext();
    const settings = getSettings();

    // Render settings panel
    const settingsHtml = await ctx.renderExtensionTemplateAsync(
        'third-party/kobold-model-switcher',
        'settings'
    );
    const settingsContainer = document.getElementById('extensions_settings');
    if (settingsContainer) {
        settingsContainer.insertAdjacentHTML('beforeend', settingsHtml);
    }

    // Sync KoboldCpp URL field
    const urlInput = document.getElementById('kms_kobold_url');
    if (urlInput) {
        urlInput.value = settings.koboldUrl;
        urlInput.addEventListener('input', () => {
            settings.koboldUrl = urlInput.value;
            ctx.saveSettingsDebounced();
        });
    }

    // Initial model list
    refreshModels();

    // Auto-refresh every 30 seconds
    setInterval(refreshModels, 30000);
}

// --- Init ---

jQuery(() => {
    initSettings();
});
