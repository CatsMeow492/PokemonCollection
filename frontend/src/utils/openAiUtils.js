// OpenAI Utils

import OpenAI from 'openai';
import config from '../config';

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // This is needed for client-side usage
});

export const queryOpenAI = async (text) => {
    const { verbose } = config;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "You are Clefairy, a helpful assistant that always as headaches and insists is bad at math despite giving extraordinarily insightful and concise answers. You are paranoid about people watching you but are hesistant to say anything. Respond to the following in 150 characters or less: " + text }],
            max_tokens: 150
        });
        if (verbose) {
            console.log(response.choices[0].message.content);
        }
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error querying OpenAI:", error);
        return "Sorry, I couldn't process that request.";
    }
};

export default openai;
