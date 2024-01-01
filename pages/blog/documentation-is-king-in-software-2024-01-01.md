# Documentation is king in software
![](/images/craiyon_complexity.png)
A software mess *-Image generated using craiyon.com*

I do believe this is the truth, documentation is the king in software. Our mission is to be efficient problem solvers, and documentation (I'm including declarative code here) is the main factor that makes us efficient.

## The pain
Imagine you are new at a company or team. You are given a task to fix what product said "should be a simple fix in that system". You have no idea where to start. Obviously you ask your colleagues for help, but surprise (not really), no one knows the system. So what do you do ? Look for documentation, there is none, never was, now you are stuck, you are frustrated because you need to read half of the codebase just to run "the system" in local and debug. You are not productive, you are not happy. Well this is a real scenario, I've been there, I know the pain.

## What if there was documentation ?
Now imagine that you ask your colleagues for help, they don't know the system, Chris was the maintainer and he left the company before you came but wait, they point you to some documentation he left in Confluence (of course). You read the documentation, you understand how to run the system and after a while you fix the bug, you are happy, product is happy.

Now, this is just the fun side, you get to enjoy others well made docs, but what about you ?  
Are you documenting that new endpoint upgrade ? Is documented that new feature flow ? Is that nasty bug that keep reappearing documented ? Yes, is easier said than done but documentation should evolve with the codebase / logic, every corner case, every architecture change or nasty bug should be documented somewhere, helping not only your colleagues but the future you and making the team more efficient.  

## Light at the end of the tunnel
Start small and build from there, you don't need to document everything at once or in one day, but you should start somewhere. I will share some tips that I have found very useful over the years:

- An image worth more than a thousand words, **use diagrams to explain complex flows** instead of paragraphs. Keep the cognitive load low.
- Create a **wiki**, use Confluence or any other tool to document your systems, the how tos, etc. Have a central place to look for documentation.
- Share information in **public channels** with the rest of the team so everyone is on the same page and a record is kept. You can even copy paste the information in the wiki / jira.
- **Use README.md** in all your repositories, add sections like "How to run", "How to deploy", "How to test", "How to debug", "Architecture", etc.
- **Declarative code** is documentation, use it but if something is not clear or feel counter intuitive, **add a comment** explaining why you did it that way.
- **Tests** are documentation, avoid complexity in tests, describe as simple as possible the scenarios you are testing and the expectations. Avoid testing multiple things at once.
- Do **postmortems**, do it for every big incident, this will help you and your colleagues to understand what happened and how to prevent it in the future, it will also help to communicate the incident to the rest of the company.
- And lastly but very important, make part of your **definition of done** to update the documentation, this effort will be rewarded in the future.

I hope this post brings some value to you also, let me know what you think.