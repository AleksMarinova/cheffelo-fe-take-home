import Link from "next/link";

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="mb-8">
        <strong>
          Cheffelo take-home test (solve task 1 & 2 + optional bonus)
        </strong>
      </h1>
      <p>If you are short on time, do <em>one</em> of the tasks.</p>

      <p>
        This application is a simple listing app that displays a list of cars
        for sale. Users are able to mark car listings as favorites, and they can
        see their favorited listings in a separate view. The app is built with
        Next.js, Redux Toolkit, and TailwindCSS.
      </p>

      <section className="flex flex-col gap-4">
        <article>
          <h2>
            <strong>Task 1</strong>
          </h2>
          <p>
            Implement the <code>GET</code>, <code>POST </code>, and{" "}
            <code>DELETE</code> API for the favorites API. The API can interact
            with the
            <code>devDb</code> object, which is a Low DB instance.
          </p>
          <p>
            Implement the <code>handleAddToFavorites</code> and{" "}
            <code>handleRemoveFromFavorites</code> functions in the{" "}
            <code>ListingCard</code> component while also updating the UI to
            reflect the change.
          </p>
          <p>
            There should also be a way to show all the user&apos;s favorite
            listings. You can implement this in a separate page or as a
            &ldquo;filter&rdquo; on the{" "}
            <Link href="/listings">listings page</Link>.
          </p>
          <p>
            The <code>favorites</code> API should also support optimistic
            updates.
          </p>
        </article>
        <article>
          <h2>
            <strong>Task 2</strong>
          </h2>
          <p>
            Implement an &ldquo;infini-loader&rdquo; in the{" "}
            <code>Listings</code> component. The infini-loader should fetch more
            listings when the user scrolls near the bottom of the page. The{" "}
            <Link href="/listings">listings page</Link> is already implemented,
            but all the items are loaded at once.
          </p>
          <p>In order to do this, you need to:</p>
          <ul className="pl-4 list-disc">
            <li>Implement pagination/cursor logic in the listings API.</li>
            <li>
              Use an IntersectionObserver to detect when the user has scrolled
              close enough to load the next page/batch of products.
            </li>
          </ul>
          <p className="font-semibold">
            For this task, you are <em>not</em> allowed to install any libraries
            that help you with infinite scrolling.
          </p>
        </article>
        <article>
          <h2>
            <strong>Bonus task</strong>
          </h2>
          <p>Build a new feature. It can be anything you like.</p>
        </article>
        <hr className="my-6" />

        <p>
          You are free to implement the tasks in either JavaScript or
          TypeScript. And you can also ignore TailwindCSS and use any other
          preferred way of styling.
        </p>

        <p>
          You are allowed to use LLMs (such as ChatGPT, Claude, Copilot, etc.)
          to help you complete the tasks.
        </p>
      </section>

      <hr className="my-6" />

      <section>
        <header>
          <h2>
            <strong>Additional information</strong>
          </h2>
        </header>

        <p>
          When evaluating the test, we will put extra emphasis on the quality of
          code, how well you follow best practices, and how you structure your
          code. In addition we will evaluate use of correct semantic HTML and
          responsiveness. The graphic &ldquo;look&rdquo; of the app is not as
          important.
        </p>
      </section>

      <section className="mt-12">
        <h2>
          <strong>Resources</strong>
        </h2>

        <ul>
          <li>
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js docs
            </a>
          </li>

          <li>
            <a
              href="https://redux-toolkit.js.org/usage/usage-guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              Redux Toolkit docs
            </a>
          </li>

          <li>
            <a
              href="https://redux-toolkit.js.org/rtk-query/usage/mutations"
              target="_blank"
              rel="noopener noreferrer"
            >
              Redux Toolkit Query (mutations)
            </a>
          </li>

          <li>
            <a
              href="https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates#optimistic-updates"
              target="_blank"
              rel="noopener noreferrer"
            >
              Redux Toolkit Query (optimistic updates)
            </a>
          </li>

          <li>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"
              target="_blank"
              rel="noopener noreferrer"
            >
              Intersection Observer API
            </a>
          </li>

          <li>
            <a
              href="https://tailwindcss.com/docs/installation"
              target="_blank"
              rel="noopener noreferrer"
            >
              TailwindCSS Docs
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
