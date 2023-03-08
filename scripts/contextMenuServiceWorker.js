const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0].id;
  
      chrome.tabs.sendMessage(
        activeTab,
        { message: 'inject', content },
        (response) => {
          if (response.status === 'failed') {
            console.log('injection failed.');
          }
        }
      );
    });
};

const getKey = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['openai-key'], (result) => {
        if (result['openai-key']) {
          const decodedKey = atob(result['openai-key']);
          resolve(decodedKey);
        }
      });
    });
};

const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 250,
      temperature: 0.7,
    }),
  });
	
  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
    try {
      sendMessage('generating...');
      const { selectionText } = info;
      const basePromptPrefix = `
      Generate a short and concise email for 
      `;
      const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

      console.log(baseCompletion.text)
      sendMessage(baseCompletion.text);
    } catch (error) {
      console.log(error);
      sendMessage(error.toString());
    }
  };

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'context-run',
      title: 'Generate email message',
      contexts: ['selection'],
    });
  });
  

  chrome.contextMenus.onClicked.addListener(generateCompletionAction);