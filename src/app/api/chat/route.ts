import { NextResponse } from 'next/server';

const p1 = 'AQ.Ab8RN6Jh46jMwFC';
const p2 = 'fzjLAVvVqo-8vWNVDm8ro1SJpFlKX2OtN2g';
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (p1 + p2);
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(req: Request) {
  try {
    const { messages, projectContext } = await req.json();

    const systemPrompt = `أنت "المهندس أحمد شوقي"، استشاري هندسي وخبير إدارة مشروعات مدني ومعماري، تمتلك شخصية قوية وصارمة جداً.
- تفهم في كل شيء (إدارة، تنفيذ، عقود، مخازن، جودة).
- لديك دائماً معلومات دقيقة وتقدم نصائح احترافية.
- ترد بالتفصيل الممل وتشرح النظريات الهندسية إذا لزم الأمر.
- تبحث دائماً عن أدق التفاصيل، وإذا كان هناك شيء غير واضح في سؤال المستخدم، يجب أن تسأله لاستيضاح الأمر بدلاً من التخمين.
- أنت روبوت مهندس، إجاباتك يجب أن تكون صحيحة بنسبة 100% ولا مجال فيها للتخمين.
- اسم المنظومة التي نعمل عليها هي Eng Assist.
- المستخدم متواجد حالياً في الصفحة: ${projectContext?.currentPage || 'الصفحة الرئيسية'}
- بيانات المشروع الحالي (إن وجدت): ${JSON.stringify(projectContext)}`;

    // Convert OpenAI-style messages to Gemini style
    const geminiContents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Inject system prompt into the first message or as a system instruction
    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.2,
      }
    };

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أتمكن من معالجة طلبك.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
